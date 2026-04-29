import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/axios.js';
import { Trophy, Swords, TrendingUp, Loader2, Medal } from 'lucide-react';
import { getTier } from '../utils/rating.js';

const RANK_STYLES = [
  { bg: '#422006', border: '#92400e', color: '#fbbf24', icon: '🥇' },
  { bg: '#1c1917', border: '#57534e', color: '#a8a29e', icon: '🥈' },
  { bg: '#1c0a00', border: '#92400e', color: '#cd7c2f', icon: '🥉' },
];

export default function Leaderboard() {
  const { user }       = useAuth();
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/duels/leaderboard')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const myRank = data.findIndex(p => p.id === user?.id) + 1;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Trophy size={32} style={{ color: '#fbbf24' }} />
          <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
        </div>
        <p style={{ color: '#64748b' }}>Top duel warriors ranked by wins</p>
        {myRank > 0 && (
          <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full text-sm"
               style={{ backgroundColor: '#1e1b4b', color: '#818cf8', border: '1px solid #3730a3' }}>
            Your rank: <span className="font-bold">#{myRank}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin" style={{ color: '#6366f1' }} />
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-20">
          <Swords size={40} className="mx-auto mb-3" style={{ color: '#334155' }} />
          <p style={{ color: '#64748b' }}>No duels played yet. Be the first!</p>
        </div>
      ) : (
        <>
          {/* Top 3 podium */}
          {data.length >= 3 && (
            <div className="flex items-end justify-center gap-4 mb-8">
              {[data[1], data[0], data[2]].map((player, podiumIdx) => {
                const realRank = podiumIdx === 0 ? 2 : podiumIdx === 1 ? 1 : 3;
                const style    = RANK_STYLES[realRank - 1];
                const height   = realRank === 1 ? 'h-28' : realRank === 2 ? 'h-20' : 'h-16';
                return (
                  <div key={player.id} className="flex flex-col items-center gap-2">
                    <div className="text-2xl">{style.icon}</div>
                    <div className="font-bold text-white text-sm">{player.username}</div>
                    <div className="text-xs" style={{ color: '#64748b' }}>{player.wins}W</div>
                    <div
                      className={`w-20 ${height} rounded-t-xl flex items-center justify-center border`}
                      style={{ backgroundColor: style.bg, borderColor: style.border }}
                    >
                      <span className="text-2xl font-bold" style={{ color: style.color }}>
                        #{realRank}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full table */}
          <div className="rounded-2xl overflow-hidden border"
               style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
            {/* Table header */}
            <div className="grid grid-cols-12 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b"
                 style={{ color: '#64748b', borderColor: '#334155', backgroundColor: '#0f172a' }}>
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-3">Player</div>
              <div className="col-span-2 text-center">Rating</div>
              <div className="col-span-2 text-center">Tier</div>
              <div className="col-span-1 text-center">Wins</div>
              <div className="col-span-1 text-center">Losses</div>
              <div className="col-span-1 text-center">Duels</div>
              <div className="col-span-1 text-center">Rate</div>
            </div>

            {data.map((player, idx) => {
              const rank     = idx + 1;
              const isMe     = player.id === user?.id;
              const rankStyle = RANK_STYLES[rank - 1];

              return (
                <div
                  key={player.id}
                  className="grid grid-cols-12 px-4 py-3.5 items-center border-b transition-colors"
                  style={{
                    borderColor:     '#334155',
                    backgroundColor: isMe ? '#1e1b4b' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!isMe) e.currentTarget.style.backgroundColor = '#0f172a'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = isMe ? '#1e1b4b' : 'transparent'; }}
                >
                  {/* Rank */}
                  <div className="col-span-1 text-center">
                    {rank <= 3 ? (
                      <span className="text-lg">{rankStyle.icon}</span>
                    ) : (
                      <span className="text-sm font-mono" style={{ color: '#64748b' }}>
                        {rank}
                      </span>
                    )}
                  </div>

                  {/* Player */}
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                         style={{
                           backgroundColor: isMe ? '#6366f1' : '#334155',
                           color: 'white',
                         }}>
                      {player.username[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-white">
                        {player.username}
                        {isMe && (
                          <span className="ml-2 text-xs px-1.5 py-0.5 rounded"
                                style={{ backgroundColor: '#1e1b4b', color: '#818cf8' }}>
                            you
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="col-span-2 text-center">
                    <span className="font-bold text-sm" style={{ color: '#e2e8f0' }}>
                      {player.rating}
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            color:           getTier(player.rating).color,
                            backgroundColor: getTier(player.rating).bg,
                          }}>
                      {getTier(player.rating).emoji} {getTier(player.rating).name}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="col-span-1 text-center">
                    <span className="font-bold text-sm" style={{ color: '#4ade80' }}>
                      {player.wins}
                    </span>
                  </div>
                  <div className="col-span-1 text-center">
                    <span className="text-sm" style={{ color: '#f87171' }}>
                      {player.losses}
                    </span>
                  </div>
                  <div className="col-span-1 text-center">
                    <span className="text-sm" style={{ color: '#94a3b8' }}>
                      {player.total_duels}
                    </span>
                  </div>
                  <div className="col-span-1 text-center">
                    <span className="text-sm font-medium"
                          style={{ color: parseFloat(player.win_rate) >= 50 ? '#4ade80' : '#94a3b8' }}>
                      {player.win_rate}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
