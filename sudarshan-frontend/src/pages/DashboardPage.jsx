import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { roomsApi } from '../services/api';
import { sha256, generateRoomId, validatePasskey } from '../utils/encryption';
import {
  Shield, Plus, Hash, LogOut, Lock, Users, Cpu,
  ChevronRight, Clock, Key, X, Eye, EyeOff, Radio
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md relative border border-border-bright bg-panel shadow-panel">
        <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-accent" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-accent" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-accent" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-accent" />
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-accent" />
            <span className="font-display text-xs text-accent tracking-widest">{title}</span>
          </div>
          <button onClick={onClose} className="text-muted hover:text-text transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function CreateRoomModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', passkey: '', description: '' });
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roomId] = useState(generateRoomId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { valid, msg } = validatePasskey(form.passkey);
    if (!valid) { toast.error(msg); return; }
    if (!form.name.trim()) { toast.error('Room name required'); return; }

    setLoading(true);
    try {
      const hashedPasskey = await sha256(form.passkey);
      const room = await roomsApi.create({
        name: form.name,
        description: form.description,
        passkey_hash: hashedPasskey,
        room_id: roomId,
      });
      toast.success('Secure room created');
      onCreated(room);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="CREATE SECURE ROOM" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs text-muted tracking-widest">ROOM NAME</label>
          <input
            className="input-field"
            placeholder="e.g. Alpha Command"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-muted tracking-widest">DESCRIPTION (OPTIONAL)</label>
          <input
            className="input-field"
            placeholder="Room purpose..."
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-muted tracking-widest">ROOM PASSKEY</label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
            <input
              type={showKey ? 'text' : 'password'}
              className="input-field pl-10 pr-10"
              placeholder="Min 8 characters"
              value={form.passkey}
              onChange={e => setForm(f => ({ ...f, passkey: e.target.value }))}
            />
            <button type="button" onClick={() => setShowKey(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-accent">
              {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-xs text-muted">Passkey is hashed (SHA-256) before leaving your device</p>
        </div>

        <div className="bg-void border border-border p-3 space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted">
            <Hash className="w-3 h-3 text-accent" />
            <span className="text-text-dim">ROOM ID:</span>
            <span className="text-accent font-display">{roomId}</span>
          </div>
          <p className="text-xs text-muted pl-5">Share this ID with members who need to join</p>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          {loading ? <><Cpu className="w-3.5 h-3.5 animate-spin" />ENCRYPTING...</> : <><Plus className="w-3.5 h-3.5" />CREATE ROOM</>}
        </button>
      </form>
    </Modal>
  );
}

function JoinRoomModal({ onClose, onJoined }) {
  const [form, setForm] = useState({ roomId: '', passkey: '' });
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.roomId.trim() || !form.passkey) { toast.error('All fields required'); return; }

    setLoading(true);
    try {
      const hashedPasskey = await sha256(form.passkey);
      const room = await roomsApi.join({
        room_id: form.roomId.toUpperCase().trim(),
        passkey_hash: hashedPasskey,
      });
      toast.success('Joined secure room');
      onJoined(room);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Invalid room ID or passkey');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="JOIN SECURE ROOM" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs text-muted tracking-widest">ROOM ID</label>
          <input
            className="input-field font-display tracking-widest"
            placeholder="XXXX-XXXX"
            value={form.roomId}
            onChange={e => setForm(f => ({ ...f, roomId: e.target.value }))}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-muted tracking-widest">ROOM PASSKEY</label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
            <input
              type={showKey ? 'text' : 'password'}
              className="input-field pl-10 pr-10"
              placeholder="Enter passkey"
              value={form.passkey}
              onChange={e => setForm(f => ({ ...f, passkey: e.target.value }))}
            />
            <button type="button" onClick={() => setShowKey(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-accent">
              {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="tag-encrypted gap-2 text-xs">
          <Lock className="w-3 h-3" />
          Passkey hashed with SHA-256 before verification
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          {loading ? <><Cpu className="w-3.5 h-3.5 animate-spin" />VERIFYING...</> : <><ChevronRight className="w-3.5 h-3.5" />JOIN ROOM</>}
        </button>
      </form>
    </Modal>
  );
}

function RoomCard({ room, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left border border-border-bright bg-surface hover:border-accent/50 hover:bg-accent-glow transition-all duration-200 p-4 group relative"
    >
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-accent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-accent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Hash className="w-3.5 h-3.5 text-accent flex-shrink-0" />
            <span className="font-display text-sm text-text truncate">{room.name}</span>
          </div>
          {room.description && (
            <p className="text-xs text-muted ml-5 truncate">{room.description}</p>
          )}
          <div className="flex items-center gap-4 mt-2 ml-5">
            <span className="text-xs text-muted font-display">{room.id}</span>
            {room.member_count && (
              <span className="flex items-center gap-1 text-xs text-muted">
                <Users className="w-3 h-3" />{room.member_count}
              </span>
            )}
            {room.last_activity && (
              <span className="flex items-center gap-1 text-xs text-muted">
                <Clock className="w-3 h-3" />
                {format(new Date(room.last_activity), 'HH:mm')}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="tag-encrypted text-xs">
            <Lock className="w-2.5 h-2.5" />E2E
          </span>
          <ChevronRight className="w-4 h-4 text-muted group-hover:text-accent transition-colors" />
        </div>
      </div>
    </button>
  );
}

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const { rooms, setRooms, addRoom } = useChatStore();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    roomsApi.list()
      .then(data => setRooms(Array.isArray(data) ? data : data.rooms || []))
      .catch(() => toast.error('Failed to load rooms'))
      .finally(() => setLoadingRooms(false));
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-void grid-bg flex flex-col">
      {/* Top nav */}
      <header className="border-b border-border bg-panel/80 backdrop-blur-md px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 border border-accent/40 flex items-center justify-center">
            <Shield className="w-4 h-4 text-accent" />
            <div className="absolute -top-px -left-px w-1.5 h-1.5 border-t border-l border-accent" />
          </div>
          <div>
            <span className="font-display text-sm text-accent tracking-widest">SUDARSHAN</span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-success rounded-full status-online" />
              <span className="text-xs text-muted">SECURE NODE ACTIVE</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted">
            <Radio className="w-3 h-3 text-accent animate-pulse" />
            <span className="font-display text-accent">{user?.username?.toUpperCase()}</span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-muted hover:text-danger transition-colors text-xs">
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">DISCONNECT</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
        {/* Welcome */}
        <div className="mb-8 animate-fade-in">
          <h2 className="font-display text-xl text-text tracking-widest mb-1">
            WELCOME, <span className="text-accent">{user?.username?.toUpperCase()}</span>
          </h2>
          <p className="text-muted text-xs">All communications are end-to-end encrypted. Zero plaintext exposure.</p>
        </div>

        {/* Security status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          {[
            { label: 'ENCRYPTION', value: 'AES-256-GCM', icon: Lock, color: 'text-success', dot: 'bg-success' },
            { label: 'KEY EXCHANGE', value: 'ECDH P-384', icon: Key, color: 'text-accent', dot: 'bg-accent' },
            { label: 'PASSKEY HASH', value: 'SHA-256', icon: Shield, color: 'text-gold', dot: 'bg-gold' },
          ].map(({ label, value, icon: Icon, color, dot }) => (
            <div key={label} className="border border-border bg-surface p-4 flex items-center gap-3">
              <div className={`w-1.5 h-1.5 rounded-full ${dot} flex-shrink-0`} />
              <div>
                <div className="text-xs text-muted mb-0.5">{label}</div>
                <div className={`font-display text-xs ${color}`}>{value}</div>
              </div>
              <Icon className={`w-4 h-4 ${color} ml-auto opacity-50`} />
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-3.5 h-3.5" />CREATE ROOM
          </button>
          <button onClick={() => setShowJoin(true)} className="btn-ghost flex items-center gap-2">
            <Hash className="w-3.5 h-3.5" />JOIN ROOM
          </button>
        </div>

        {/* Rooms list */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted tracking-widest">SECURE ROOMS ({rooms.length})</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {loadingRooms ? (
            <div className="flex items-center justify-center py-16 gap-3 text-muted">
              <Cpu className="w-4 h-4 animate-spin text-accent" />
              <span className="text-sm">LOADING ROOMS...</span>
            </div>
          ) : rooms.length === 0 ? (
            <div className="border border-dashed border-border text-center py-16">
              <Hash className="w-8 h-8 text-muted mx-auto mb-3" />
              <p className="text-muted text-sm mb-1">NO ROOMS YET</p>
              <p className="text-xs text-muted/60">Create or join a secure room to begin</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rooms.map(room => (
                <div key={room.id} className="animate-slide-up">
                  <RoomCard
                    room={room}
                    onClick={() => navigate(`/room/${room.id}`)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showCreate && (
        <CreateRoomModal
          onClose={() => setShowCreate(false)}
          onCreated={(room) => addRoom(room)}
        />
      )}
      {showJoin && (
        <JoinRoomModal
          onClose={() => setShowJoin(false)}
          onJoined={(room) => addRoom(room)}
        />
      )}
    </div>
  );
}
