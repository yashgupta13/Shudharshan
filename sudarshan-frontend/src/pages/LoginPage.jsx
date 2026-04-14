import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Shield, Lock, User, Eye, EyeOff, Cpu } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      toast.error('All fields required');
      return;
    }
    const result = await login(form.username, form.password);
    if (result.success) {
      toast.success('Authentication successful');
      navigate('/dashboard');
    } else {
      toast.error(result.error || 'Authentication failed');
    }
  };

  return (
    <div className="min-h-screen bg-void grid-bg flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative animate-fade-in">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 border border-accent/40 relative mb-6">
            <div className="absolute inset-0 bg-accent/5" />
            <Shield className="w-8 h-8 text-accent" />
            <div className="absolute -top-px -left-px w-3 h-3 border-t border-l border-accent" />
            <div className="absolute -bottom-px -right-px w-3 h-3 border-b border-r border-accent" />
          </div>
          <h1 className="font-display text-2xl text-accent tracking-widest mb-1">SUDARSHAN</h1>
          <p className="text-muted text-xs tracking-widest font-body">SECURE AUTHENTICATION REQUIRED</p>
        </div>

        {/* Form panel */}
        <div className="relative border border-border-bright bg-panel/80 backdrop-blur-md p-8">
          {/* Corner brackets */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-accent" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-accent" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-accent" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-accent" />

          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border">
            <Lock className="w-3 h-3 text-accent" />
            <span className="text-xs text-muted tracking-widest font-display">OPERATOR LOGIN</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted tracking-widest">OPERATOR ID</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
                <input
                  type="text"
                  autoComplete="username"
                  className="input-field pl-10"
                  placeholder="Enter username"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted tracking-widest">ACCESS CODE</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
                <input
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="input-field pl-10 pr-10"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-accent transition-colors"
                >
                  {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full mt-2 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Cpu className="w-3.5 h-3.5 animate-spin" />
                  AUTHENTICATING...
                </>
              ) : (
                <>
                  <Shield className="w-3.5 h-3.5" />
                  AUTHENTICATE
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-border text-center">
            <span className="text-muted text-xs">NO CREDENTIALS? </span>
            <Link
              to="/signup"
              className="text-accent text-xs hover:underline underline-offset-4 tracking-widest font-display"
            >
              REQUEST ACCESS
            </Link>
          </div>
        </div>

        {/* Security notice and Developer Credit */}
        <div className="mt-4 flex flex-col items-center gap-1 text-muted text-[10px] tracking-[0.2em]">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-success rounded-full status-online" />
            <span>AES-256 + ECDH SECURED SESSION</span>
          </div>
          <div className="opacity-40">DEVELOPED BY TANISH KHANDELWAL</div>
        </div>
      </div>
    </div>
  );
}
