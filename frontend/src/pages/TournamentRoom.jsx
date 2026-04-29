import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/axios.js';
import { Loader2, Play, Trophy, CheckCircle2, AlertCircle } from 'lucide-react';
import { MarkdownRenderer } from './Admin.jsx';
import Editor from '../components/Editor.jsx';

export default function TournamentRoom() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tourney, setTourney] = useState(null);
  const [problems, setProblems] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeProblemId, setActiveProblemId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);

  const fetchTourney = async () => {
    try {
      const [tourneyRes, lbRes] = await Promise.all([
        api.get(`/tournaments/${id}`),
        api.get(`/tournaments/${id}/leaderboard`)
      ]);
      setTourney(tourneyRes.data);
      setProblems(tourneyRes.data.problems);
      setLeaderboard(lbRes.data);
      if (tourneyRes.data.problems?.length > 0 && !activeProblemId) {
        setActiveProblemId(tourneyRes.data.problems[0].id);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error loading tournament');
      navigate('/tournaments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTourney();
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchTourney, 10000);
    return () => clearInterval(interval);
  }, [id]);

  const handleStart = async () => {
    try {
      await api.post(`/tournaments/${id}/start`);
      fetchTourney();
    } catch (e) {
      alert('Failed to start');
    }
  };

  const handleEnd = async () => {
    if (!confirm('End tournament?')) return;
    try {
      await api.post(`/tournaments/${id}/end`);
      fetchTourney();
    } catch (e) {
      alert('Failed to end');
    }
  };

  const handleSubmit = async (code, language) => {
    setSubmitting(true);
    setSubmitResult(null);
    try {
      const res = await api.post(`/tournaments/${id}/submit`, {
        problemId: activeProblemId,
        code,
        language
      });
      setSubmitResult(res.data);
      fetchTourney(); // refresh points
    } catch (err) {
      setSubmitResult({ error: err.response?.data?.message || 'Failed to submit' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRun = async (code, language) => {
    setRunning(true);
    setRunResult(null);
    setSubmitResult(null);
    try {
      const res = await api.post('/problems/run', { code, language, input: '1 2 3\n' }); // default sample input if needed
      setRunResult(res.data);
    } catch (err) {
      setRunResult({ error: err.response?.data?.message || 'Run failed' });
    } finally {
      setRunning(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={32} className="animate-spin" style={{ color: '#6366f1' }} />
    </div>
  );

  if (!tourney) return null;

  const activeProblem = problems.find(p => p.id === activeProblemId);
  const myRank = leaderboard.findIndex(p => p.user_id === user.id) + 1;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col relative overflow-hidden">
      {/* Background blobs */}
      <div className="bg-glow-blob" style={{ width: '600px', height: '600px', top: '-10%', left: '-10%', background: '#4f46e5' }}></div>
      <div className="bg-glow-blob" style={{ width: '500px', height: '500px', bottom: '-20%', right: '-5%', background: '#7c3aed', animationDelay: '2s' }}></div>

      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between glass-panel z-10 rounded-b-xl border-x-0 border-t-0 mb-4 mx-4 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Trophy size={24} style={{ color: '#fbbf24' }} className="drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" /> 
            {tourney.name}
          </h1>
          <div className="text-xs mt-1.5 font-medium tracking-wide uppercase" style={{ color: '#94a3b8' }}>
            Status: <span style={{ color: tourney.status === 'active' ? '#4ade80' : tourney.status === 'waiting' ? '#fbbf24' : '#94a3b8' }} className="ml-1 text-glow">{tourney.status}</span>
          </div>
        </div>

        {user.role === 'admin' && (
          <div className="flex gap-3">
            {tourney.status === 'waiting' && (
              <button onClick={handleStart} className="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold text-white">
                Start Tournament
              </button>
            )}
            {tourney.status === 'active' && (
              <button onClick={handleEnd} className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-500 text-white shadow-lg transition-all hover:-translate-y-0.5">
                End Tournament
              </button>
            )}
          </div>
        )}
      </div>

      {tourney.status === 'waiting' ? (
        <div className="flex-1 flex items-center justify-center z-10 px-4 pb-4">
          <div className="text-center glass-panel-heavy p-16 rounded-3xl max-w-lg w-full">
            <Trophy size={80} className="mx-auto mb-6" style={{ color: '#fbbf24', opacity: 0.8 }} />
            <h2 className="text-3xl font-bold text-white mb-3">Starting Soon</h2>
            <p className="text-lg" style={{ color: '#94a3b8' }}>Wait for the administrator to begin the event.</p>
          </div>
        </div>
      ) : tourney.status === 'finished' ? (
        <div className="flex-1 flex flex-col items-center justify-start p-8 overflow-y-auto z-10">
          <div className="glass-panel-heavy p-10 rounded-3xl w-full max-w-3xl flex flex-col items-center mb-8">
            <Trophy size={72} className="mb-4 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]" style={{ color: '#fbbf24' }} />
            <h2 className="text-4xl font-bold text-white mb-2 text-glow">Tournament Ended</h2>
            <p className="text-lg" style={{ color: '#94a3b8' }}>Final Standings</p>
          </div>
          
          <div className="w-full max-w-3xl glass-panel rounded-2xl overflow-hidden shadow-2xl">
            {leaderboard.map((l, i) => (
              <div key={l.user_id} className="flex items-center gap-6 p-6 border-b border-white/5 transition-colors" style={{ backgroundColor: l.user_id === user.id ? 'rgba(99, 102, 241, 0.15)' : 'transparent' }}>
                <div className="w-16 text-center font-black text-3xl" style={{ color: i === 0 ? '#fbbf24' : i === 1 ? '#e2e8f0' : i === 2 ? '#b45309' : '#64748b' }}>
                  #{i + 1}
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold mb-1" style={{ color: l.user_id === user.id ? '#818cf8' : 'white' }}>{l.username}</div>
                  <div className="text-sm font-medium text-indigo-200/60">Rating: {l.rating}</div>
                </div>
                <div className="text-3xl font-black text-indigo-400 drop-shadow-md">
                  {l.score} <span className="text-sm font-semibold text-indigo-400/60">pts</span>
                </div>
              </div>
            ))}
            {leaderboard.length === 0 && <div className="p-10 text-center text-slate-400 font-medium">No participants submitted any code.</div>}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex min-h-0 px-4 pb-4 gap-4 z-10">
          
          {/* Left Column: Problems List & Leaderboard */}
          <div className="w-[28%] flex flex-col gap-4">
            
            {/* Leaderboard Preview */}
            <div className="h-1/3 flex flex-col glass-panel rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 font-semibold text-sm flex justify-between items-center bg-black/20 text-white shadow-sm">
                Live Leaderboard
                {myRank > 0 && <span className="text-xs px-2 py-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Rank #{myRank}</span>}
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {leaderboard.map((l, i) => (
                  <div key={l.user_id} className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all" style={{ backgroundColor: l.user_id === user.id ? 'rgba(99, 102, 241, 0.2)' : 'transparent', color: l.user_id === user.id ? '#818cf8' : '#cbd5e1' }}>
                    <div className="flex items-center gap-3">
                      <span className="w-5 text-xs font-bold text-slate-500">{i + 1}</span>
                      <span className="font-semibold">{l.username}</span>
                    </div>
                    <span className="font-black text-indigo-300">{l.score}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Problems List */}
            <div className="flex-1 flex flex-col glass-panel rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 font-semibold text-sm bg-black/20 text-white shadow-sm">
                Tournament Problems
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {problems.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setActiveProblemId(p.id); setSubmitResult(null); setRunResult(null); }}
                    className="w-full text-left px-4 py-4 rounded-xl transition-all border relative overflow-hidden group hover-float"
                    style={{
                      background: activeProblemId === p.id ? 'rgba(79, 70, 229, 0.15)' : 'rgba(15, 23, 42, 0.4)',
                      borderColor: activeProblemId === p.id ? 'rgba(99, 102, 241, 0.5)' : 'rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    {activeProblemId === p.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 shadow-[0_0_10px_#6366f1]" />}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-semibold ${activeProblemId === p.id ? 'text-white' : 'text-slate-300'}`}>{p.title}</span>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-900/80 text-indigo-300 border border-indigo-900/50 shadow-sm">
                        {p.points} pts
                      </span>
                    </div>
                    {p.solved && (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-green-400 mt-2">
                        <CheckCircle2 size={14} className="drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]" /> Solved
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Middle Column: Problem Description */}
          <div className="w-[36%] glass-panel rounded-2xl overflow-y-auto p-8 custom-scrollbar">
            {activeProblem ? (
              <div className="animate-in fade-in duration-300">
                <div className="mb-8 pb-5 border-b border-white/10">
                  <h2 className="text-3xl font-extrabold text-white mb-3 text-glow tracking-tight">{activeProblem.title}</h2>
                  <div className="flex gap-3">
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      Points: {activeProblem.points}
                    </span>
                    {activeProblem.solved && (
                      <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/30 flex items-center gap-1.5 shadow-[0_0_10px_rgba(74,222,128,0.1)]">
                        <CheckCircle2 size={14} /> Solved Successfully
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="prose prose-invert prose-indigo max-w-none">
                  <MarkdownRenderer content={activeProblem.description} />
                </div>
                
                {runResult && (
                  <div className="mt-10 border-t border-white/10 pt-8 animate-in slide-in-from-bottom-4 duration-500">
                    <h3 className="font-bold text-white mb-4 text-lg flex items-center gap-2">
                      <Play size={18} className="text-cyan-400" /> Run Output
                    </h3>
                    <div className="rounded-xl p-5 border border-white/5 bg-black/40 shadow-inner">
                      {runResult.error ? (
                        <p className="text-sm font-mono text-red-400">{runResult.error}</p>
                      ) : (
                        <>
                          <pre className="text-sm font-mono whitespace-pre-wrap text-cyan-200">
                            {runResult.stdout || '(no output)'}
                          </pre>
                          {runResult.stderr && (
                            <pre className="text-sm font-mono mt-3 whitespace-pre-wrap text-red-300 border-t border-red-900/30 pt-3">
                              {runResult.stderr}
                            </pre>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                {submitResult && (
                  <div className="mt-10 border-t border-white/10 pt-8 animate-in slide-in-from-bottom-4 duration-500">
                    <h3 className="font-bold text-white mb-4 text-lg flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-indigo-400" /> Evaluation Result
                    </h3>
                    {submitResult.error ? (
                      <div className="p-5 rounded-xl border border-red-900/50 bg-red-950/40 text-red-300 flex gap-4 text-sm shadow-lg shadow-red-900/20">
                        <AlertCircle size={20} className="flex-shrink-0 text-red-500" />
                        <pre className="whitespace-pre-wrap font-mono">{submitResult.error}</pre>
                      </div>
                    ) : (
                      <div className="glass-panel p-6 rounded-2xl bg-white/5">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-medium text-slate-300 uppercase tracking-wider">Test Cases Passed</span>
                          <span className={`text-2xl font-black drop-shadow-md ${submitResult.passed === submitResult.total ? 'text-green-400' : 'text-orange-400'}`}>
                            {submitResult.passed} <span className="text-lg text-white/40">/ {submitResult.total}</span>
                          </span>
                        </div>
                        
                        <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden mb-4 shadow-inner">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${submitResult.passed === submitResult.total ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-gradient-to-r from-orange-500 to-amber-500'}`}
                            style={{ width: `${Math.max(5, (submitResult.passed / submitResult.total) * 100)}%` }}
                          >
                            <div className="absolute inset-0 bg-white/20 w-full h-full transform -skew-x-12 translate-x-full animate-[shimmer_2s_infinite]" />
                          </div>
                        </div>

                        {submitResult.pointsEarned !== undefined && submitResult.pointsEarned > 0 && (
                          <div className="text-center mt-6">
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                              <Trophy size={16} className="text-indigo-400" /> +{submitResult.pointsEarned} Points
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
                <Code2 size={64} className="mb-4 text-slate-600" />
                <p className="text-lg font-medium">Select a problem to view</p>
              </div>
            )}
          </div>

          {/* Right Column: Editor */}
          <div className="w-[36%] flex flex-col glass-panel rounded-2xl overflow-hidden p-1 shadow-2xl">
            <Editor
              onRun={handleRun}
              onSubmit={handleSubmit}
              isRunning={running}
              isSubmitting={submitting}
              disabled={!activeProblem || tourney.status !== 'active'}
            />
          </div>

        </div>
      )}
    </div>
  );
}
