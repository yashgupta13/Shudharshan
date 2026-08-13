import { useState, useCallback } from 'react';
import { useChannelActionContext, useChannelStateContext } from 'stream-chat-react';
import { useTranslationStore } from '../store/translationStore';
import { useEncryptionStore } from '../store/encryptionStore';
import { encryptMessage, encryptWithPasskey } from '../utils/encryption';
import { Send, Languages, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TranslationMessageInput() {
  const { sendMessage } = useChannelActionContext();
  const { channel } = useChannelStateContext();
  const { enabled, selectedLanguage, translateText } = useTranslationStore();
  const { getRoomKey, hasRoomKey } = useEncryptionStore();
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const roomId = channel?.id;
  const hasEncryption = hasRoomKey(roomId);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!text.trim() || isSending) return;

    setIsSending(true);
    try {
      let messageText = text.trim();

      // Step 1: Translate if enabled
      if (enabled && selectedLanguage !== 'eng_Latn') {
        try {
          messageText = await translateText(text.trim(), selectedLanguage, 'eng_Latn');
        } catch (error) {
          console.error('Translation failed, sending original:', error);
          toast.error('Translation failed, sending original message');
        }
      }

      // Step 2: Encrypt the message
      let encryptedPayload = null;
      let isEncrypted = false;

      if (hasEncryption) {
        try {
          const encryptionKey = getRoomKey(roomId);
          const { ciphertext, iv } = await encryptWithPasskey(messageText, encryptionKey);

          encryptedPayload = {
            ciphertext,
            iv,
          };
          isEncrypted = true;
        } catch (error) {
          console.error('Encryption failed:', error);
          toast.error('Encryption failed, sending unencrypted');
        }
      }

      // Step 3: Send the message
      await sendMessage({
        text: isEncrypted ? '[encrypted]' : messageText,
        customData: {
          encrypted: isEncrypted,
          ...(isEncrypted && encryptedPayload),
          originalLanguage: enabled && selectedLanguage !== 'eng_Latn' ? selectedLanguage : 'eng_Latn',
          originalText: enabled && selectedLanguage !== 'eng_Latn' ? text.trim() : null,
        }
      });

      setText('');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  }, [text, enabled, selectedLanguage, translateText, sendMessage, isSending, hasEncryption, getRoomKey, roomId]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-border bg-panel p-3">
      <div className="flex items-center gap-2 mb-2 text-xs">
        {hasEncryption && (
          <div className="flex items-center gap-1 text-success/70">
            <Lock className="w-3 h-3" />
            <span>E2E Encrypted</span>
          </div>
        )}
        {enabled && selectedLanguage !== 'eng_Latn' && (
          <div className="flex items-center gap-1 text-accent/70">
            <Languages className="w-3 h-3" />
            <span>Auto-translate to English</span>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={enabled && selectedLanguage !== 'eng_Latn'
            ? 'Type in your language...'
            : 'Type a message...'}
          disabled={isSending}
          className="flex-1 px-4 py-2 bg-surface border border-border-bright text-text placeholder-muted focus:outline-none focus:border-accent transition-colors text-sm"
        />
        <button
          type="submit"
          disabled={!text.trim() || isSending}
          className="px-4 py-2 bg-accent text-void border border-accent hover:bg-accent-dim transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {hasEncryption && <Lock className="w-3 h-3" />}
          <Send className="w-4 h-4" />
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
