import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';

import Navbar      from './components/Navbar.jsx';
import Home        from './pages/Home.jsx';
import Problem     from './pages/Problem.jsx';
import DuelRoom    from './components/DuelRoom.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import Admin       from './pages/Admin.jsx';
import Login       from './pages/Login.jsx';
import Register    from './pages/Register.jsx';
import Tournament  from './pages/Tournament.jsx';
import TournamentRoom from './pages/TournamentRoom.jsx';

// ─── Protected Route wrapper ─────────────────────────────────────────────────
const Protected = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

// ─── Admin-only Route ─────────────────────────────────────────────────────────
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user)             return <Navigate to="/login"  replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0f172a' }}>
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected */}
        <Route path="/" element={
          <Protected><Home /></Protected>
        } />
        <Route path="/problems/:id" element={
          <Protected><Problem /></Protected>
        } />
        <Route path="/duel/:roomCode" element={
          <Protected><DuelRoom /></Protected>
        } />
        <Route path="/leaderboard" element={
          <Protected><Leaderboard /></Protected>
        } />
        <Route path="/tournaments" element={
          <Protected><Tournament /></Protected>
        } />
        <Route path="/tournaments/:id" element={
          <Protected><TournamentRoom /></Protected>
        } />

        {/* Admin */}
        <Route path="/admin" element={
          <AdminRoute><Admin /></AdminRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
