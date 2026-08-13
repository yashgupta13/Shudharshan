import { useEffect, useState } from 'react';
import { MessageSimple, useMessageContext } from 'stream-chat-react';
import { useTranslationStore } from '../store/translationStore';
import { useEncryptionStore } from '../store/encryptionStore';
import { decryptWithPasskey } from '../utils/encryption';
import { Languages, Lock, AlertTriangle } from 'lucide-react';

export default function TranslatedMessage() {
  const { message, channel } = useMessageContext();
  const { enabled, selectedLanguage, translateText } = useTranslationStore();
  const { getRoomKey, hasRoomKey } = useEncryptionStore();
  const [translatedText, setTranslatedText] = useState(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [decryptedText, setDecryptedText] = useState(null);
  const [decryptionError, setDecryptionError] = useState(false);

  const roomId = channel?.id;
  const isEncrypted = message.customData?.encrypted;
  const hasEncryption = hasRoomKey(roomId);

  // Step 1: Decrypt if encrypted
  useEffect(() => {
    const decrypt = async () => {
      if (isEncrypted && hasEncryption) {
        try {
          const encryptionKey = getRoomKey(roomId);
          const { ciphertext, iv } = message.customData;

          if (ciphertext && iv) {
            const decrypted = await decryptWithPasskey(ciphertext, iv, encryptionKey);
            setDecryptedText(decrypted);
            setDecryptionError(false);
          }
        } catch (error) {
          console.error('Decryption failed:', error);
          setDecryptionError(true);
          setDecryptedText(null);
        }
      } else if (isEncrypted && !hasEncryption) {
        setDecryptionError(true);
        setDecryptedText(null);
      } else {
        setDecryptedText(null);
        setDecryptionError(false);
      }
    };

    decrypt();
  }, [isEncrypted, hasEncryption, message.customData, getRoomKey, roomId]);

  // Step 2: Translate if translation is enabled
  useEffect(() => {
    const translate = async () => {
      const textToTranslate = decryptedText || message.text;

      if (enabled && selectedLanguage !== 'eng_Latn' && textToTranslate && textToTranslate !== '[encrypted]') {
        const translated = await translateText(textToTranslate, 'eng_Latn', selectedLanguage);
        if (translated !== textToTranslate) {
          setTranslatedText(translated);
        } else {
          setTranslatedText(null);
        }
      } else {
        setTranslatedText(null);
      }
    };

    if (decryptedText !== null || !isEncrypted) {
      translate();
    }
  }, [enabled, selectedLanguage, decryptedText, message.text, translateText, isEncrypted]);

  // Create a modified message object with decrypted text
  const displayMessage = {
    ...message,
    text: decryptionError
      ? '[Decryption failed - missing key]'
      : translatedText || decryptedText || message.text,
  };

  return (
    <div className="str-chat__message-wrapper">
      <MessageSimple message={displayMessage} />

      {/* Encryption indicator */}
      {isEncrypted && !decryptionError && (
        <div className="flex items-center gap-1 text-xs text-success/60 mt-1 ml-10">
          <Lock className="w-2.5 h-2.5" />
          <span>E2E Encrypted</span>
        </div>
      )}

      {/* Decryption error indicator */}
      {decryptionError && (
        <div className="flex items-center gap-1 text-xs text-danger/70 mt-1 ml-10">
          <AlertTriangle className="w-3 h-3" />
          <span>Failed to decrypt - missing encryption key</span>
        </div>
      )}

      {/* Translation toggle */}
      {translatedText && !decryptionError && (
        <div className="str-chat__message-translation">
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className="flex items-center gap-1 text-xs text-accent/70 hover:text-accent mt-1 ml-10 transition-colors"
          >
            <Languages className="w-3 h-3" />
            <span>{showOriginal ? 'Show translation' : 'Show original'}</span>
          </button>
          {showOriginal && (
            <div className="text-xs text-muted/70 mt-1 ml-10 italic">
              Original: {decryptedText || message.text}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
