import { useEffect, useRef, useCallback } from 'react';
import { ChatWebSocket, MSG_TYPES } from '../services/websocket';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import {
  generateDHKeyPair,
  deriveSharedSecret,
  encryptMessage,
  decryptMessage,
} from '../utils/encryption';
import toast from 'react-hot-toast';

export function useWebSocket(roomId) {
  const wsRef = useRef(null);
  const { token, user } = useAuthStore();
  const {
    addMessage,
    setTyping,
    clearTyping,
    setEncryptionKey,
    getEncryptionKey,
    addOnlineUser,
    removeOnlineUser,
    setWsStatus,
  } = useChatStore();

  const sendEncrypted = useCallback(async (text) => {
    if (!wsRef.current?.isConnected) return false;
    
    const keyData = getEncryptionKey(roomId);
    
    if (keyData?.aesKey) {
      // Full E2E with derived shared secret
      const { ciphertext, iv } = await encryptMessage(text, keyData.aesKey);
      return wsRef.current.send({
        type: MSG_TYPES.ENCRYPTED_MESSAGE,
        ciphertext,
        iv,
        sender: user.username,
        timestamp: Date.now(),
      });
    } else {
      // Fallback: send as regular (still shows in UI as pending encryption)
      return wsRef.current.send({
        type: MSG_TYPES.MESSAGE,
        content: text,
        sender: user.username,
        timestamp: Date.now(),
      });
    }
  }, [roomId, user, getEncryptionKey]);

  const sendTyping = useCallback((isTyping) => {
    wsRef.current?.send({
      type: isTyping ? MSG_TYPES.TYPING : MSG_TYPES.STOP_TYPING,
      sender: user.username,
    });
  }, [user]);

  const initiateDHExchange = useCallback(async () => {
    const { keyPair, publicKeyHex } = await generateDHKeyPair();
    setEncryptionKey(roomId, { dhKeyPair: keyPair, publicKeyHex });
    
    wsRef.current?.send({
      type: MSG_TYPES.DH_EXCHANGE,
      publicKey: publicKeyHex,
      sender: user.username,
    });
  }, [roomId, user, setEncryptionKey]);

  useEffect(() => {
    if (!roomId || !token) return;

    const ws = new ChatWebSocket(roomId, token, {
      onOpen: async () => {
        setWsStatus('connected');
        // Initiate DH key exchange on connect
        await initiateDHExchange();
      },

      onMessage: async (data) => {
        switch (data.type) {
          case MSG_TYPES.PONG:
            break;

          case MSG_TYPES.DH_EXCHANGE: {
            if (data.sender === user.username) break;
            // Respond with our public key and derive shared secret
            const keyData = getEncryptionKey(roomId);
            if (keyData?.dhKeyPair) {
              const aesKey = await deriveSharedSecret(
                keyData.dhKeyPair.privateKey,
                data.publicKey
              );
              setEncryptionKey(roomId, { aesKey });
              // Send our public key back
              wsRef.current?.send({
                type: MSG_TYPES.DH_RESPONSE,
                publicKey: keyData.publicKeyHex,
                sender: user.username,
              });
            }
            break;
          }

          case MSG_TYPES.DH_RESPONSE: {
            if (data.sender === user.username) break;
            const keyData = getEncryptionKey(roomId);
            if (keyData?.dhKeyPair && !keyData.aesKey) {
              const aesKey = await deriveSharedSecret(
                keyData.dhKeyPair.privateKey,
                data.publicKey
              );
              setEncryptionKey(roomId, { aesKey });
            }
            break;
          }

          case MSG_TYPES.ENCRYPTED_MESSAGE: {
            const keyData = getEncryptionKey(roomId);
            if (keyData?.aesKey) {
              try {
                const plaintext = await decryptMessage(
                  data.ciphertext,
                  data.iv,
                  keyData.aesKey
                );
                addMessage(roomId, {
                  id: data.id || `${Date.now()}-${Math.random()}`,
                  content: plaintext,
                  sender: data.sender,
                  timestamp: data.timestamp || Date.now(),
                  encrypted: true,
                  self: data.sender === user.username,
                });
              } catch {
                addMessage(roomId, {
                  id: `${Date.now()}-err`,
                  content: '[Decryption failed – key mismatch]',
                  sender: data.sender,
                  timestamp: data.timestamp || Date.now(),
                  encrypted: false,
                  error: true,
                  self: false,
                });
              }
            }
            break;
          }

          case MSG_TYPES.MESSAGE: {
            addMessage(roomId, {
              id: data.id || `${Date.now()}-${Math.random()}`,
              content: data.content,
              sender: data.sender,
              timestamp: data.timestamp || Date.now(),
              encrypted: false,
              self: data.sender === user.username,
            });
            break;
          }

          case MSG_TYPES.TYPING:
            if (data.sender !== user.username) setTyping(roomId, data.sender);
            break;

          case MSG_TYPES.STOP_TYPING:
            if (data.sender !== user.username) clearTyping(roomId, data.sender);
            break;

          case MSG_TYPES.USER_JOIN:
            addOnlineUser(roomId, data.userId || data.sender);
            addMessage(roomId, {
              id: `sys-${Date.now()}`,
              content: `${data.sender || data.userId} joined the room`,
              system: true,
              timestamp: Date.now(),
            });
            break;

          case MSG_TYPES.USER_LEAVE:
            removeOnlineUser(roomId, data.userId || data.sender);
            addMessage(roomId, {
              id: `sys-${Date.now()}`,
              content: `${data.sender || data.userId} left the room`,
              system: true,
              timestamp: Date.now(),
            });
            break;

          case MSG_TYPES.FILE:
            addMessage(roomId, {
              id: data.id || `${Date.now()}-file`,
              content: data.filename,
              sender: data.sender,
              timestamp: data.timestamp || Date.now(),
              isFile: true,
              fileUrl: data.url,
              fileType: data.fileType,
              self: data.sender === user.username,
            });
            break;

          case MSG_TYPES.ERROR:
            toast.error(data.message || 'Server error');
            break;
        }
      },

      onClose: () => setWsStatus('reconnecting'),
      onError: () => setWsStatus('disconnected'),
      onMaxReconnects: () => {
        setWsStatus('disconnected');
        toast.error('Connection lost. Please refresh.');
      },
    });

    ws.connect();
    wsRef.current = ws;

    return () => ws.disconnect();
  }, [roomId, token]);

  return { sendEncrypted, sendTyping, ws: wsRef.current };
}
