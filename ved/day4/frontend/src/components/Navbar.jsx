import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Swords, Trophy, ShieldCheck, LogOut,
  User, Menu, X, Home,
} from 'lucide-react';
import { getTier } from '../utils/rating.js';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();
  const [open, setOpen]  = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/',            label: 'Problems',    icon: Home,       show: !!user },
    { to: '/leaderboard', label: 'Leaderboard', icon: Trophy,     show: !!user },
    { to: '/admin',       label: 'Admin',       icon: ShieldCheck, show: user?.role === 'admin' },
  ];

  const isActive = (path) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(path);

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 border-b"
         style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="p-1.5 rounded-lg transition-colors"
                 style={{ backgroundColor: '#1e293b' }}>
              <Swords size={20} color="#6366f1" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              Algo<span style={{ color: '#6366f1' }}>Clash</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.filter(l => l.show).map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  color:           isActive(to) ? '#818cf8' : '#94a3b8',
                  backgroundColor: isActive(to) ? '#1e1b4b' : 'transparent',
                }}
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                 style={{ backgroundColor: '#1e293b' }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                   style={{ backgroundColor: '#6366f1', color: 'white' }}>
                {user.username[0].toUpperCase()}
              </div>
              <span className="text-sm font-medium" style={{ color: '#e2e8f0' }}>
                {user.username}
              </span>
              {user.role === 'admin' ? (
                <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                      style={{ backgroundColor: '#451a03', color: '#fb923c' }}>
                  admin
                </span>
              ) : (
                <span className="text-xs px-1.5 py-0.5 rounded font-medium flex items-center gap-1"
                      style={{
                        backgroundColor: getTier(user.rating ?? 800).bg,
                        color:           getTier(user.rating ?? 800).color,
                      }}>
                  {getTier(user.rating ?? 800).emoji} {getTier(user.rating ?? 800).name}
                </span>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
              style={{ color: '#64748b' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.backgroundColor = '#1e293b'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 rounded-lg"
            style={{ color: '#94a3b8' }}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Nav */}
        {open && (
          <div className="md:hidden py-3 border-t space-y-1"
               style={{ borderColor: '#1e293b' }}>
            {navLinks.filter(l => l.show).map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium"
                style={{
                  color:           isActive(to) ? '#818cf8' : '#94a3b8',
                  backgroundColor: isActive(to) ? '#1e1b4b' : 'transparent',
                }}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm w-full"
              style={{ color: '#ef4444' }}
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
