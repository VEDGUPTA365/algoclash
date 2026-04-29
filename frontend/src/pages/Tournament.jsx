import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/axios.js';
import { Trophy, Loader2, Play, Users, Clock } from 'lucide-react';

export default function Tournament() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tournaments')
      .then(res => setTournaments(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleJoin = async (id, status) => {
    if (status === 'finished') {
      navigate(`/tournaments/${id}`);
      return;
    }

    try {
      // First try to just enter the room (in case they already joined)
      await api.get(`/tournaments/${id}`);
      navigate(`/tournaments/${id}`);
    } catch (err) {
      if (err.response?.status === 403) {
        // Not joined yet, prompt for code
        const code = prompt('Please enter the Join Code for this tournament:');
        if (!code) return;
        
        try {
          const res = await api.post(`/tournaments/join`, { joinCode: code.toUpperCase() });
          navigate(`/tournaments/${res.data.id}`);
        } catch (joinErr) {
          alert(joinErr.response?.data?.message || 'Failed to join. Invalid code?');
        }
      } else {
        alert('Failed to enter tournament room');
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Trophy size={32} style={{ color: '#fbbf24' }} />
          Tournaments
        </h1>
        <p style={{ color: '#64748b' }}>
          Compete in live tournaments, solve problems, and climb the ranks!
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin" style={{ color: '#6366f1' }} />
        </div>
      ) : tournaments.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border" style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
          <Trophy size={48} className="mx-auto mb-4" style={{ color: '#334155' }} />
          <h2 className="text-xl font-semibold text-white mb-2">No active tournaments</h2>
          <p style={{ color: '#64748b' }}>Check back later or ask an admin to create one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tournaments.map(t => (
            <div key={t.id} className="p-5 rounded-xl border flex flex-col transition-all hover:-translate-y-1"
                 style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-white">{t.name}</h3>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
                      style={{
                        color: t.status === 'waiting' ? '#fbbf24' : t.status === 'active' ? '#4ade80' : '#94a3b8',
                        backgroundColor: t.status === 'waiting' ? '#451a03' : t.status === 'active' ? '#052e16' : '#0f172a',
                        border: `1px solid ${t.status === 'waiting' ? '#b45309' : t.status === 'active' ? '#166534' : '#334155'}`
                      }}>
                  {t.status}
                </span>
              </div>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm" style={{ color: '#94a3b8' }}>
                  <Users size={16} /> {t.player_count} enrolled
                </div>
                <div className="flex items-center gap-2 text-sm" style={{ color: '#94a3b8' }}>
                  <Clock size={16} /> Created {new Date(t.created_at).toLocaleDateString()}
                </div>
              </div>

              <div className="mt-auto">
                <button
                  onClick={() => handleJoin(t.id, t.status)}
                  className="w-full py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
                  style={{
                    backgroundColor: t.status === 'finished' ? '#334155' : '#6366f1',
                    color: t.status === 'finished' ? '#94a3b8' : 'white',
                  }}
                >
                  {t.status === 'finished' ? 'View Results' : t.status === 'active' ? <><Play size={16} /> Enter Arena</> : 'Join & Wait'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
