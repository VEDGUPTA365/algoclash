import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/axios.js';
import {
  Search, Swords, ChevronRight, Loader2,
  Code2, Trophy, Plus, Hash, Dices, Bookmark, CheckCircle2
} from 'lucide-react';
import RandomDuelButton from '../components/RandomDuelButton.jsx';

const DIFFICULTY_STYLE = {
  Easy:   { color: '#4ade80', bg: '#052e16' },
  Medium: { color: '#fb923c', bg: '#431407' },
  Hard:   { color: '#f87171', bg: '#450a0a' },
};

const PREDEFINED_TAGS = ['Arrays', 'Strings', 'Math', 'Dynamic Programming', 'Graphs', 'Trees', 'Greedy', 'Binary Search', 'Sorting', 'Two Pointers'];

export default function Home() {
  const { user }     = useAuth();
  const navigate     = useNavigate();
  const [problems,   setProblems]   = useState([]);
  const [filtered,   setFiltered]   = useState([]);
  const [search,     setSearch]     = useState('');
  const [difficulty, setDifficulty] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All'); // All, Solved, Unsolved, Marked
  const [tagFilter,  setTagFilter]    = useState('All');
  const [loading,    setLoading]    = useState(true);

  // Duel modal state
  const [showDuelModal, setShowDuelModal] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [roomCode,  setRoomCode]   = useState('');
  const [duelMode,  setDuelMode]   = useState('create'); // 'create' | 'join'
  const [duelLoading, setDuelLoading] = useState(false);
  const [duelError,   setDuelError]   = useState('');

  useEffect(() => {
    api.get('/problems')
      .then(res => { setProblems(res.data); setFiltered(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = problems;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (p.tags && p.tags.some(tag => tag.toLowerCase().includes(q)))
      );
    }
    if (difficulty !== 'All') {
      result = result.filter(p => p.difficulty === difficulty);
    }
    if (statusFilter === 'Solved') {
      result = result.filter(p => p.status === 'solved');
    } else if (statusFilter === 'Unsolved') {
      result = result.filter(p => p.status !== 'solved');
    } else if (statusFilter === 'Marked') {
      result = result.filter(p => p.marked);
    }
    if (tagFilter !== 'All') {
      result = result.filter(p => p.tags && p.tags.includes(tagFilter));
    }
    setFiltered(result);
  }, [search, difficulty, statusFilter, tagFilter, problems]);

  // Combine predefined tags with any custom tags that might exist in the DB
  const allTags = Array.from(new Set([
    ...PREDEFINED_TAGS,
    ...problems.flatMap(p => p.tags || [])
  ])).sort();

  const openDuelModal = (problem, mode) => {
    setSelectedProblem(problem);
    setDuelMode(mode);
    setDuelError('');
    setRoomCode('');
    setShowDuelModal(true);
  };

  const handleCreateDuel = async () => {
    setDuelLoading(true);
    setDuelError('');
    try {
      const res = await api.post('/duels', { problemId: selectedProblem.id });
      navigate(`/duel/${res.data.room_code}`);
    } catch (err) {
      setDuelError(err.response?.data?.message || 'Failed to create room.');
    } finally {
      setDuelLoading(false);
    }
  };

  const handleJoinDuel = async () => {
    if (!roomCode.trim()) { setDuelError('Enter a room code.'); return; }
    setDuelLoading(true);
    setDuelError('');
    try {
      await api.post(`/duels/join/${roomCode.trim().toUpperCase()}`);
      navigate(`/duel/${roomCode.trim().toUpperCase()}`);
    } catch (err) {
      setDuelError(err.response?.data?.message || 'Could not join room.');
    } finally {
      setDuelLoading(false);
    }
  };

  const stats = {
    total:  problems.length,
    easy:   problems.filter(p => p.difficulty === 'Easy').length,
    medium: problems.filter(p => p.difficulty === 'Medium').length,
    hard:   problems.filter(p => p.difficulty === 'Hard').length,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            Problem Arena
          </h1>
          <p style={{ color: '#64748b' }}>
            Choose a problem, practice solo, or clash with an opponent.
          </p>
        </div>
        <RandomDuelButton />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total',  value: stats.total,  color: '#818cf8' },
          { label: 'Easy',   value: stats.easy,   color: '#4ade80' },
          { label: 'Medium', value: stats.medium, color: '#fb923c' },
          { label: 'Hard',   value: stats.hard,   color: '#f87171' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 border text-center"
               style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-sm mt-0.5" style={{ color: '#64748b' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3" style={{ color: '#475569' }} />
          <input
            type="text"
            placeholder="Search problems or tags…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-white outline-none"
            style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
            onFocus={e => e.target.style.borderColor = '#6366f1'}
            onBlur={e  => e.target.style.borderColor = '#334155'}
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: '#1e293b' }}>
            {['All', 'Easy', 'Medium', 'Hard'].map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className="px-4 py-1.5 rounded-md text-sm font-medium transition-all"
                style={{
                  backgroundColor: difficulty === d ? '#6366f1' : 'transparent',
                  color:           difficulty === d ? 'white'    : '#94a3b8',
                }}
              >
                {d}
              </button>
            ))}
          </div>

          <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: '#1e293b' }}>
            {['All', 'Solved', 'Unsolved', 'Marked'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="px-4 py-1.5 rounded-md text-sm font-medium transition-all"
                style={{
                  backgroundColor: statusFilter === s ? '#334155' : 'transparent',
                  color:           statusFilter === s ? 'white'    : '#94a3b8',
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex items-center px-3 rounded-lg border" style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
            <select
              value={tagFilter}
              onChange={e => setTagFilter(e.target.value)}
              className="bg-transparent text-sm font-medium outline-none py-1.5 cursor-pointer appearance-none"
              style={{ color: tagFilter === 'All' ? '#94a3b8' : 'white' }}
            >
              <option value="All" style={{ backgroundColor: '#0f172a' }}>All Topics</option>
              {allTags.map(tag => (
                <option key={tag} value={tag} style={{ backgroundColor: '#0f172a' }}>{tag}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              const unsolved = problems.filter(p => p.status !== 'solved');
              if (unsolved.length > 0) {
                const random = unsolved[Math.floor(Math.random() * unsolved.length)];
                navigate(`/problems/${random.id}`);
              } else {
                alert('You solved all problems!');
              }
            }}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 border"
            style={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#cbd5e1' }}
          >
            <Dices size={14} /> Random Problem
          </button>
        </div>
      </div>

      {/* Join existing room quick bar */}
      <div className="flex items-center gap-3 mb-6 p-4 rounded-xl border"
           style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
        <Hash size={18} style={{ color: '#6366f1', flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Have a room code? Enter it here…"
          value={roomCode}
          onChange={e => setRoomCode(e.target.value.toUpperCase())}
          className="flex-1 bg-transparent text-sm text-white outline-none placeholder-slate-500"
          maxLength={8}
        />
        <button
          onClick={() => {
            if (roomCode.trim()) {
              setDuelMode('join');
              setSelectedProblem(null);
              setDuelError('');
              setShowDuelModal(true);
            }
          }}
          disabled={!roomCode.trim()}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
          style={{ backgroundColor: '#6366f1', color: 'white' }}
        >
          Join Room
        </button>
      </div>

      {/* Problem List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin" style={{ color: '#6366f1' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Code2 size={40} className="mx-auto mb-3" style={{ color: '#334155' }} />
          <p style={{ color: '#64748b' }}>No problems found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((problem, idx) => {
            const ds = DIFFICULTY_STYLE[problem.difficulty] || DIFFICULTY_STYLE.Medium;
            return (
              <div
                key={problem.id}
                className="flex items-center gap-4 p-4 rounded-xl border transition-all group"
                style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#475569'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#334155'}
              >
                {/* Index & Status */}
                <div className="w-8 flex flex-col items-center">
                  <span className="text-sm font-mono mb-1" style={{ color: '#475569' }}>
                    {idx + 1}
                  </span>
                  {problem.status === 'solved' && <CheckCircle2 size={16} style={{ color: '#4ade80' }} />}
                  {problem.marked && <Bookmark size={16} style={{ color: '#fcd34d' }} className="mt-1" />}
                </div>

                {/* Title + meta */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate flex items-center gap-2">
                    {problem.title}
                    {problem.tags && problem.tags.length > 0 && problem.tags.map(tag => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-800 text-slate-300 border border-slate-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                    {problem.test_count} test cases · {problem.source === 'manual' ? 'Custom' : 'Codeforces'}
                  </div>
                </div>

                {/* Difficulty badge */}
                <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{ color: ds.color, backgroundColor: ds.bg }}>
                  {problem.difficulty}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => navigate(`/problems/${problem.id}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ backgroundColor: '#0f172a', color: '#94a3b8', border: '1px solid #334155' }}
                  >
                    Solve <ChevronRight size={12} />
                  </button>
                  <button
                    onClick={() => openDuelModal(problem, 'create')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ backgroundColor: '#1e1b4b', color: '#818cf8', border: '1px solid #3730a3' }}
                  >
                    <Swords size={12} /> Duel
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Duel Modal */}
      {showDuelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
             onClick={() => setShowDuelModal(false)}>
          <div className="rounded-2xl p-6 w-full max-w-md border shadow-2xl"
               style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
               onClick={e => e.stopPropagation()}>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: '#1e1b4b' }}>
                <Swords size={22} color="#818cf8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {duelMode === 'create' ? 'Create Duel Room' : 'Join Duel Room'}
                </h3>
                {selectedProblem && (
                  <p className="text-sm" style={{ color: '#64748b' }}>
                    {selectedProblem.title}
                  </p>
                )}
              </div>
            </div>

            {duelMode === 'join' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>
                  Room Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. XK92AB"
                  value={roomCode}
                  onChange={e => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  className="w-full px-4 py-3 rounded-lg text-white text-lg tracking-widest font-mono outline-none"
                  style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e  => e.target.style.borderColor = '#334155'}
                />
              </div>
            )}

            {duelMode === 'create' && (
              <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: '#0f172a' }}>
                <p className="text-sm" style={{ color: '#94a3b8' }}>
                  A unique room code will be generated. Share it with your opponent to start the clash!
                </p>
              </div>
            )}

            {duelError && (
              <div className="mb-4 px-3 py-2 rounded-lg text-sm"
                   style={{ backgroundColor: '#450a0a', color: '#fca5a5' }}>
                {duelError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowDuelModal(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                style={{ backgroundColor: '#0f172a', color: '#94a3b8', border: '1px solid #334155' }}
              >
                Cancel
              </button>
              <button
                onClick={duelMode === 'create' ? handleCreateDuel : handleJoinDuel}
                disabled={duelLoading}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ backgroundColor: '#6366f1', color: 'white' }}
              >
                {duelLoading
                  ? <Loader2 size={16} className="animate-spin" />
                  : <Swords size={16} />
                }
                {duelMode === 'create' ? 'Create Room' : 'Join Room'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
