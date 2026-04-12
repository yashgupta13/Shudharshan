import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Shield, Lock, User, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

function StrengthBar({ password }) {
  const checks = [
    { label: 'Min 8 chars', ok: password.length >= 8 },
    { label: 'Uppercase', ok: /[A-Z]/.test(password) },
    { label: 'Lowercase', ok: /[a-z]/.test(password) },
    { label: 'Number', ok: /\d/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['bg-danger', 'bg-danger', 'bg-gold', 'bg-success', 'bg-success'];

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`h-0.5 flex-1 transition-all duration-300 ${i < score ? colors[score] : 'bg-border-bright'}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1">
        {checks.map(c => (
          <div key={c.label} className={`flex items-center gap-1 text-xs ${c.ok ? 'text-success' : 'text-muted'}`}>
            {c.ok ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {c.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SignupPage() {
  const [form, setForm] = useState({ username: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const { signup, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      toast.error('All fields required');
      return;
    }
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password too weak');
      return;
    }
    const result = await signup(form.username, form.password);
    if (result.success) {
      toast.success('Account created. Welcome to SUDARSHAN.');
      navigate('/dashboard');
    } else {
      toast.error(result.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-void grid-bg flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 -left-32 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 border border-gold/40 relative mb-6">
            <div className="absolute inset-0 bg-gold/5" />
            <Shield className="w-8 h-8 text-gold" />
            <div className="absolute -top-px -left-px w-3 h-3 border-t border-l border-gold" />
            <div className="absolute -bottom-px -right-px w-3 h-3 border-b border-r border-gold" />
          </div>
          <h1 className="font-display text-2xl text-gold tracking-widest mb-1">SUDARSHAN</h1>
          <p className="text-muted text-xs tracking-widest">OPERATOR REGISTRATION</p>
        </div>

        <div className="relative border border-border-bright bg-panel/80 backdrop-blur-md p-8">
          <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-gold" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-gold" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-gold" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-gold" />

          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border">
            <Lock className="w-3 h-3 text-gold" />
            <span className="text-xs text-muted tracking-widest font-display">NEW OPERATOR</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs text-muted tracking-widest">OPERATOR ID</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
                <input
                  type="text"
                  autoComplete="username"
                  className="input-field pl-10 focus:border-gold focus:shadow-glow-gold"
                  placeholder="Choose username"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted tracking-widest">ACCESS CODE</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
                <input
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="input-field pl-10 pr-10 focus:border-gold focus:shadow-glow-gold"
                  placeholder="Choose password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-gold transition-colors"
                >
                  {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {form.password && <StrengthBar password={form.password} />}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted tracking-widest">CONFIRM CODE</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
                <input
                  type="password"
                  autoComplete="new-password"
                  className={`input-field pl-10 focus:border-gold focus:shadow-glow-gold ${
                    form.confirm && form.confirm !== form.password ? 'border-danger' : ''
                  }`}
                  placeholder="Confirm password"
                  value={form.confirm}
                  onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                />
              </div>
              {form.confirm && form.confirm !== form.password && (
                <p className="text-danger text-xs mt-1">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 relative px-6 py-2.5 font-display text-xs tracking-widest uppercase text-void bg-gold border border-gold hover:bg-gold-dim hover:shadow-glow-gold active:scale-95 transition-all duration-150 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {isLoading ? 'REGISTERING...' : (
                <>
                  <Shield className="w-3.5 h-3.5" />
                  CREATE ACCOUNT
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-border text-center">
            <span className="text-muted text-xs">HAVE CREDENTIALS? </span>
            <Link
              to="/login"
              className="text-accent text-xs hover:underline underline-offset-4 tracking-widest font-display"
            >
              AUTHENTICATE
            </Link>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-muted text-xs">
          <div className="w-1.5 h-1.5 bg-success rounded-full status-online" />
          <span>REGISTRATION ENCRYPTED IN TRANSIT</span>
        </div>
      </div>
    </div>
  );
}
