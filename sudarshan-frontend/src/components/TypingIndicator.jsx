export default function TypingIndicator({ users }) {
  if (!users || users.length === 0) return null;

  const label = users.length === 1
    ? `${users[0]} is typing`
    : users.length === 2
      ? `${users[0]} and ${users[1]} are typing`
      : `${users.length} people are typing`;

  return (
    <div className="flex items-center gap-2 px-4 py-2 animate-fade-in">
      <div className="flex items-center gap-1 h-4">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
      <span className="text-xs text-muted italic">{label}...</span>
    </div>
  );
}
