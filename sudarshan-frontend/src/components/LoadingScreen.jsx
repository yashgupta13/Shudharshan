export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-void grid-bg flex flex-col items-center justify-center gap-8">
      <div className="relative">
        <div className="w-16 h-16 border border-accent/30 rotate-45 animate-pulse-slow" />
        <div className="absolute inset-2 border border-accent/60 rotate-45 animate-spin" style={{ animationDuration: '3s' }} />
        <div className="absolute inset-4 bg-accent/20 rotate-45" />
      </div>
      <div className="font-display text-accent text-xs tracking-[0.3em] animate-pulse">
        INITIALIZING SUDARSHAN...
      </div>
    </div>
  );
}
