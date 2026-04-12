import { useState, useRef, useCallback } from 'react';
import { Send, Paperclip, Image, X, Cpu } from 'lucide-react';
import toast from 'react-hot-toast';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function ChatInput({ onSend, onTyping, disabled }) {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [sending, setSending] = useState(false);
  const fileRef = useRef(null);
  const typingTimer = useRef(null);
  const isTyping = useRef(false);

  const handleTyping = useCallback(() => {
    if (!isTyping.current) {
      isTyping.current = true;
      onTyping?.(true);
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      isTyping.current = false;
      onTyping?.(false);
    }, 2000);
  }, [onTyping]);

  const handleSend = async () => {
    if ((!text.trim() && !file) || disabled || sending) return;

    setSending(true);
    try {
      if (file) {
        await onSend({ type: 'file', file, text: text.trim() });
        setFile(null);
        setFilePreview(null);
      } else {
        await onSend({ type: 'text', text: text.trim() });
      }
      setText('');
      isTyping.current = false;
      clearTimeout(typingTimer.current);
      onTyping?.(false);
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE_SIZE) {
      toast.error('File too large (max 10MB)');
      return;
    }
    setFile(f);
    if (f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f);
      setFilePreview(url);
    } else {
      setFilePreview(null);
    }
  };

  const clearFile = () => {
    setFile(null);
    setFilePreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="border-t border-border bg-panel p-4">
      {/* File preview */}
      {file && (
        <div className="mb-3 flex items-start gap-3 bg-void border border-border-bright p-3">
          {filePreview ? (
            <img src={filePreview} alt="preview" className="w-16 h-16 object-cover border border-border" />
          ) : (
            <div className="w-16 h-16 border border-border-bright flex items-center justify-center bg-surface">
              <Paperclip className="w-5 h-5 text-accent" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-text truncate">{file.name}</p>
            <p className="text-xs text-muted">{(file.size / 1024).toFixed(1)} KB</p>
            <p className="text-xs text-accent mt-1">Ready to send</p>
          </div>
          <button onClick={clearFile} className="text-muted hover:text-danger transition-colors mt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        {/* File upload buttons */}
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => { fileRef.current.accept = '*/*'; fileRef.current.click(); }}
            className="w-9 h-9 border border-border-bright hover:border-accent hover:bg-accent-glow text-muted hover:text-accent transition-all flex items-center justify-center"
            title="Attach file"
            disabled={disabled}
          >
            <Paperclip className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { fileRef.current.accept = 'image/*'; fileRef.current.click(); }}
            className="w-9 h-9 border border-border-bright hover:border-accent hover:bg-accent-glow text-muted hover:text-accent transition-all flex items-center justify-center"
            title="Attach image"
            disabled={disabled}
          >
            <Image className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Text area */}
        <div className="flex-1 relative border border-border-bright focus-within:border-accent focus-within:shadow-glow-accent transition-all">
          <textarea
            className="w-full bg-void px-4 py-3 text-sm text-text placeholder-muted resize-none focus:outline-none font-body"
            placeholder={disabled ? 'Connecting...' : 'Type encrypted message... (Enter to send)'}
            rows={1}
            style={{ minHeight: '44px', maxHeight: '120px' }}
            value={text}
            disabled={disabled}
            onChange={e => { setText(e.target.value); handleTyping(); }}
            onKeyDown={handleKeyDown}
            onInput={e => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={(!text.trim() && !file) || disabled || sending}
          className="w-9 h-9 bg-accent border border-accent hover:bg-accent-dim hover:shadow-glow-accent active:scale-95 transition-all flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
        >
          {sending
            ? <Cpu className="w-3.5 h-3.5 text-void animate-spin" />
            : <Send className="w-3.5 h-3.5 text-void" />
          }
        </button>

        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <div className="flex items-center justify-between mt-2 px-1">
        <span className="text-xs text-muted/60">Messages encrypted with AES-256-GCM before sending</span>
        <span className="text-xs text-muted/60">{text.length > 0 ? `${text.length}` : ''}</span>
      </div>
    </div>
  );
}
