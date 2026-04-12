import { Lock, Users, Wifi, WifiOff, RefreshCw, Hash, Key, Shield } from 'lucide-react';

const statusConfig = {
  connected: { icon: Wifi, color: 'text-success', label: 'CONNECTED', dot: 'bg-success' },
  reconnecting: { icon: RefreshCw, color: 'text-gold animate-spin', label: 'RECONNECTING', dot: 'bg-gold' },
  disconnected: { icon: WifiOff, color: 'text-danger', label: 'OFFLINE', dot: 'bg-danger' },
};

export default function RoomHeader({ room, onlineCount, wsStatus, encryptionReady }) {
  const status = statusConfig[wsStatus] || statusConfig.disconnected;
  const StatusIcon = status.icon;

  return (
    <div className="border-b border-border bg-panel px-4 py-3 flex items-center justify-between gap-4 flex-shrink-0">
      {/* Room info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative w-8 h-8 border border-accent/40 flex items-center justify-center flex-shrink-0">
          <Hash className="w-3.5 h-3.5 text-accent" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-display text-sm text-text tracking-wider truncate">{room?.name || 'LOADING...'}</span>
            {room?.id && (
              <span className="text-xs text-muted font-display hidden sm:inline">{room.id}</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <div className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              <span className="text-xs text-muted">{status.label}</span>
            </div>
            {onlineCount > 0 && (
              <div className="flex items-center gap-1 text-muted">
                <Users className="w-3 h-3" />
                <span className="text-xs">{onlineCount} online</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Security status */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {encryptionReady ? (
          <div className="flex items-center gap-1.5 border border-success/30 bg-success/10 px-2.5 py-1">
            <Lock className="w-3 h-3 text-success" />
            <span className="text-xs text-success font-display tracking-widest hidden sm:inline">E2E ACTIVE</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 border border-gold/30 bg-gold/10 px-2.5 py-1">
            <Key className="w-3 h-3 text-gold animate-pulse" />
            <span className="text-xs text-gold font-display tracking-widest hidden sm:inline">EXCHANGING KEYS</span>
          </div>
        )}
        <div className="hidden sm:flex items-center gap-1.5 border border-border-bright px-2.5 py-1">
          <Shield className="w-3 h-3 text-accent" />
          <span className="text-xs text-muted" style={{ fontSize: '10px' }}>AES-256</span>
        </div>
      </div>
    </div>
  );
}
