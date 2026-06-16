import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Swords, Mail, Lock, Loader2 } from 'lucide-react';

export default function Login() {
  const { login }    = useAuth();
  const navigate     = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ backgroundColor: '#0f172a' }}>
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Swords size={36} color="#6366f1" />
            <span className="text-3xl font-bold text-white tracking-tight">
              Algo<span style={{ color: '#6366f1' }}>Clash</span>
            </span>
          </div>
          <p style={{ color: '#94a3b8' }}>Sign in to enter the arena</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 border"
             style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
          <h2 className="text-xl font-semibold text-white mb-6">Welcome back</h2>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm"
                 style={{ backgroundColor: '#450a0a', color: '#fca5a5', border: '1px solid #7f1d1d' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3.5" style={{ color: '#475569' }} />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-lg text-sm text-white outline-none transition-all"
                  style={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                  }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e  => e.target.style.borderColor = '#334155'}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3.5" style={{ color: '#475569' }} />
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-lg text-sm text-white outline-none transition-all"
                  style={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                  }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e  => e.target.style.borderColor = '#334155'}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-60 mt-2"
              style={{ backgroundColor: '#6366f1' }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: '#64748b' }}>
            No account?{' '}
            <Link to="/register" style={{ color: '#818cf8' }} className="font-medium hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
