import { Lock, File, Image, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

function FilePreview({ message }) {
  const isImage = message.fileType?.startsWith('image/');
  if (isImage && message.fileUrl) {
    return (
      <div className="mt-2 max-w-xs">
        <img
          src={message.fileUrl}
          alt={message.content}
          className="max-w-full border border-border-bright"
          style={{ maxHeight: '200px', objectFit: 'contain' }}
        />
        <div className="flex items-center gap-1 mt-1 text-xs text-muted">
          <Image className="w-3 h-3" />
          {message.content}
        </div>
      </div>
    );
  }
  return (
    <div className="mt-2 flex items-center gap-2 border border-border-bright bg-void px-3 py-2 max-w-xs">
      <File className="w-4 h-4 text-accent flex-shrink-0" />
      <span className="text-xs text-text truncate">{message.content}</span>
    </div>
  );
}

export default function MessageBubble({ message }) {
  if (message.system) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-muted bg-surface border border-border px-3 py-1">
          {message.content}
        </span>
      </div>
    );
  }

  const isSelf = message.self;
  const time = format(new Date(message.timestamp || Date.now()), 'HH:mm');

  return (
    <div className={`flex gap-2.5 msg-enter ${isSelf ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {!isSelf && (
        <div className="w-7 h-7 bg-surface border border-border-bright flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-xs font-display text-accent-dim">
            {message.sender?.[0]?.toUpperCase() || '?'}
          </span>
        </div>
      )}

      <div className={`flex flex-col max-w-[70%] ${isSelf ? 'items-end' : 'items-start'}`}>
        {/* Sender + time */}
        <div className={`flex items-center gap-2 mb-1 ${isSelf ? 'flex-row-reverse' : 'flex-row'}`}>
          {!isSelf && (
            <span className="text-xs font-display text-accent-dim">{message.sender}</span>
          )}
          <span className="text-xs text-muted">{time}</span>
          {message.encrypted && (
            <Lock className="w-2.5 h-2.5 text-success" />
          )}
          {message.error && (
            <AlertTriangle className="w-2.5 h-2.5 text-danger" />
          )}
        </div>

        {/* Bubble */}
        <div
          className={`px-4 py-2.5 relative text-sm leading-relaxed ${
            message.error
              ? 'border border-danger/30 bg-danger/10 text-danger'
              : isSelf
                ? 'msg-bubble-self'
                : 'msg-bubble-other'
          }`}
        >
          {/* Corner accent for self messages */}
          {isSelf && !message.error && (
            <>
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-accent/30" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-accent/10" />
            </>
          )}

          {message.isFile ? (
            <FilePreview message={message} />
          ) : (
            <span className="break-words">{message.content}</span>
          )}
        </div>

        {/* Encrypted indicator */}
        {message.encrypted && (
          <div className="flex items-center gap-1 mt-0.5 px-1">
            <Lock className="w-2 h-2 text-success/60" />
            <span className="text-success/60" style={{ fontSize: '10px' }}>E2E ENCRYPTED</span>
          </div>
        )}
      </div>
    </div>
  );
}
