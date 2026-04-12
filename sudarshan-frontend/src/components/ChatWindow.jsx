import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { Lock, Shield } from 'lucide-react';

export default function ChatWindow({ messages, typingUsers, roomName }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      {/* Room welcome banner */}
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
          <div className="relative w-16 h-16 border border-accent/30 flex items-center justify-center">
            <div className="absolute inset-0 bg-accent/5" />
            <Shield className="w-7 h-7 text-accent" />
            <div className="absolute -top-px -left-px w-3 h-3 border-t border-l border-accent" />
            <div className="absolute -bottom-px -right-px w-3 h-3 border-b border-r border-accent" />
          </div>
          <div>
            <p className="font-display text-sm text-accent tracking-widest mb-1">#{roomName}</p>
            <p className="text-muted text-xs mb-3">This is the beginning of your secure channel.</p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-success/30 bg-success/10 text-success text-xs">
              <Lock className="w-3 h-3" />
              End-to-End Encrypted · AES-256-GCM
            </div>
          </div>
        </div>
      )}

      {messages.map((msg, i) => (
        <MessageBubble key={msg.id || i} message={msg} />
      ))}

      <TypingIndicator users={typingUsers} />

      <div ref={bottomRef} />
    </div>
  );
}
