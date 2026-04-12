import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { roomsApi } from '../services/api';
import Sidebar from '../components/Sidebar';
import RoomHeader from '../components/RoomHeader';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';
import { Menu, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChatRoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    rooms, addRoom, setCurrentRoom, getCurrentMessages,
    getTypingUsers, wsStatus, onlineUsers, encryptionKeys
  } = useChatStore();

  const [room, setRoom] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingRoom, setLoadingRoom] = useState(true);

  const { sendEncrypted, sendTyping } = useWebSocket(roomId);

  // Load room info
  useEffect(() => {
    setCurrentRoom(roomId);

    // Check if we already have room in store
    const existing = rooms.find(r => r.id === roomId);
    if (existing) {
      setRoom(existing);
      setLoadingRoom(false);
      return;
    }

    // Fetch from API
    roomsApi.info(roomId)
      .then(data => {
        setRoom(data);
        addRoom(data);
      })
      .catch(() => {
        toast.error('Room not found or access denied');
        navigate('/dashboard');
      })
      .finally(() => setLoadingRoom(false));

    return () => setCurrentRoom(null);
  }, [roomId]);

  const messages = getCurrentMessages();
  const typingUsers = getTypingUsers(roomId);
  const onlineCount = (onlineUsers[roomId] || []).length;
  const encryptionReady = !!encryptionKeys[roomId]?.aesKey;

  const handleSend = useCallback(async ({ type, text, file }) => {
    if (type === 'file' && file) {
      // Read file and send as base64 (for demo; real app would upload to S3/CDN)
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        // In a real app, upload to server and get URL back
        // For now, add message locally with object URL
        const url = URL.createObjectURL(file);
        const { addMessage } = useChatStore.getState();
        addMessage(roomId, {
          id: `local-${Date.now()}`,
          content: file.name,
          sender: user.username,
          timestamp: Date.now(),
          isFile: true,
          fileUrl: url,
          fileType: file.type,
          self: true,
          encrypted: false,
        });
      };
      reader.readAsDataURL(file);

      // If there's also text, send it
      if (text) await sendEncrypted(text);
      return;
    }

    if (text) {
      await sendEncrypted(text);
    }
  }, [roomId, user, sendEncrypted]);

  const handleTyping = useCallback((isTyping) => {
    sendTyping(isTyping);
  }, [sendTyping]);

  if (loadingRoom) {
    return (
      <div className="h-screen bg-void grid-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border border-accent/40 border-t-accent animate-spin mx-auto mb-4" />
          <p className="text-muted text-xs tracking-widest">LOADING SECURE ROOM...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-void flex overflow-hidden">
      {/* Sidebar - desktop always visible, mobile overlay */}
      <div className={`
        fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:flex md:flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar currentRoomId={roomId} />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-void/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile menu button in header */}
        <div className="md:hidden absolute top-3 left-3 z-20">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="w-9 h-9 border border-border-bright bg-panel flex items-center justify-center text-muted hover:text-accent transition-colors"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        <RoomHeader
          room={room}
          onlineCount={onlineCount}
          wsStatus={wsStatus}
          encryptionReady={encryptionReady}
        />

        {/* Connection warning */}
        {wsStatus === 'disconnected' && (
          <div className="bg-danger/10 border-b border-danger/30 px-4 py-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-danger rounded-full" />
            <span className="text-xs text-danger">Connection lost. Messages may not be delivered.</span>
          </div>
        )}
        {wsStatus === 'reconnecting' && (
          <div className="bg-gold/10 border-b border-gold/30 px-4 py-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse" />
            <span className="text-xs text-gold">Reconnecting to secure channel...</span>
          </div>
        )}

        <ChatWindow
          messages={messages}
          typingUsers={typingUsers}
          roomName={room?.name || roomId}
        />

        <ChatInput
          onSend={handleSend}
          onTyping={handleTyping}
          disabled={wsStatus === 'disconnected'}
        />
      </div>
    </div>
  );
}
