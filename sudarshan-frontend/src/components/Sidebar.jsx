import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import {
  Shield, Hash, LogOut, ArrowLeft, Radio,
  Lock, Users, ChevronRight
} from 'lucide-react';

export default function Sidebar({ currentRoomId, onSelectRoom }) {
  const { user, logout } = useAuthStore();
  const { rooms } = useChatStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex flex-col h-full bg-panel border-r border-border w-64 flex-shrink-0">
      {/* Logo */}
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className="relative w-8 h-8 border border-accent/40 flex items-center justify-center flex-shrink-0">
          <Shield className="w-4 h-4 text-accent" />
          <div className="absolute -top-px -left-px w-1.5 h-1.5 border-t border-l border-accent" />
        </div>
        <div>
          <div className="font-display text-xs text-accent tracking-widest leading-none">SUDARSHAN</div>
          <div className="flex items-center gap-1 mt-0.5">
            <div className="w-1 h-1 bg-success rounded-full" />
            <span className="text-xs text-muted" style={{ fontSize: '10px' }}>SECURE</span>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2 px-2 py-1.5 bg-void border border-border">
          <div className="w-6 h-6 bg-accent/20 border border-accent/40 flex items-center justify-center flex-shrink-0">
            <Radio className="w-3 h-3 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-display text-accent truncate">{user?.username?.toUpperCase()}</div>
            <div className="text-xs text-muted" style={{ fontSize: '10px' }}>OPERATOR</div>
          </div>
        </div>
      </div>

      {/* Back to dashboard */}
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 px-4 py-2.5 text-muted hover:text-accent hover:bg-accent-glow transition-all text-xs border-b border-border"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>DASHBOARD</span>
      </button>

      {/* Rooms */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2 flex items-center justify-between">
          <span className="text-xs text-muted tracking-widest">ROOMS</span>
          <span className="text-xs text-muted">{rooms.length}</span>
        </div>

        {rooms.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <Hash className="w-6 h-6 text-muted mx-auto mb-2" />
            <p className="text-xs text-muted">No rooms joined</p>
          </div>
        ) : (
          <div className="space-y-0.5 px-2">
            {rooms.map(room => (
              <button
                key={room.id}
                onClick={() => onSelectRoom ? onSelectRoom(room.id) : navigate(`/room/${room.id}`)}
                className={`w-full text-left px-3 py-2.5 transition-all duration-150 flex items-center gap-2 group ${
                  currentRoomId === room.id
                    ? 'bg-accent-glow border-l-2 border-accent text-text'
                    : 'text-muted hover:text-text hover:bg-surface border-l-2 border-transparent'
                }`}
              >
                <Hash className={`w-3.5 h-3.5 flex-shrink-0 ${currentRoomId === room.id ? 'text-accent' : 'text-muted group-hover:text-text-dim'}`} />
                <span className="flex-1 truncate text-xs font-body">{room.name}</span>
                <Lock className="w-2.5 h-2.5 text-success opacity-60 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Encryption status */}
      <div className="p-3 border-t border-border space-y-1">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Lock className="w-3 h-3 text-success" />
          <span style={{ fontSize: '10px' }}>AES-256-GCM ACTIVE</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <Users className="w-3 h-3 text-accent" />
          <span style={{ fontSize: '10px' }}>ECDH KEY EXCHANGE</span>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 p-4 text-muted hover:text-danger hover:bg-danger/5 transition-all border-t border-border text-xs"
      >
        <LogOut className="w-3.5 h-3.5" />
        DISCONNECT
      </button>
    </div>
  );
}
