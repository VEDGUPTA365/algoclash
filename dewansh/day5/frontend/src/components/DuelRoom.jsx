import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm    from 'remark-gfm';
import { useAuth } from '../context/AuthContext.jsx';
import socket from '../socket.js';
import api    from '../api/axios.js';
import Editor from './Editor.jsx';
import {
  Swords, Copy, Check, Users, Loader2,
  Trophy, XCircle, CheckCircle2, Wifi,
  WifiOff, ChevronDown, ChevronUp,
} from 'lucide-react';

function MarkdownRenderer({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => <h1 className="text-lg font-bold mt-3 mb-1" style={{ color: '#e2e8f0' }}>{children}</h1>,
        h2: ({ children }) => <h2 className="text-sm font-bold mt-3 mb-1" style={{ color: '#818cf8' }}>{children}</h2>,
        h3: ({ children }) => <h3 className="text-xs font-bold mt-2 mb-1" style={{ color: '#a5b4fc' }}>{children}</h3>,
        p:  ({ children }) => <p className="mb-2 leading-relaxed text-sm" style={{ color: '#cbd5e1' }}>{children}</p>,
        strong: ({ children }) => <strong style={{ color: '#e2e8f0', fontWeight: 600 }}>{children}</strong>,
        ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2 ml-2 text-sm">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2 ml-2 text-sm">{children}</ol>,
        li: ({ children }) => <li style={{ color: '#cbd5e1' }}>{children}</li>,
        code: ({ inline, children }) =>
          inline ? (
            <code className="px-1.5 py-0.5 rounded text-xs font-mono"
                  style={{ backgroundColor: '#334155', color: '#a5f3fc' }}>
              {children}
            </code>
          ) : (
            <pre className="p-3 rounded-lg overflow-x-auto my-2"
                 style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}>
              <code className="text-xs font-mono" style={{ color: '#a5f3fc' }}>{children}</code>
            </pre>
          ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export default function DuelRoom() {
  const { roomCode } = useParams();
  const { user }     = useAuth();
  const navigate     = useNavigate();

  const [duel,        setDuel]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [connected,   setConnected]   = useState(false);
  const [playerCount, setPlayerCount] = useState(1);
  const [waitingForOpponent, setWaitingForOpponent] = useState(true);

  const [problem, setProblem] = useState(null);

  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [myResult,      setMyResult]      = useState(null);
  const [expandedTests, setExpandedTests] = useState({});

  const [opponent,           setOpponent]           = useState(null);
  const [opponentProgress,   setOpponentProgress]   = useState({ passed: 0, total: 0 });
  const [opponentSubmitting, setOpponentSubmitting] = useState(false);

  const [duelOver, setDuelOver] = useState(false);
  const [winner,   setWinner]   = useState(null);
  const [iWon,     setIWon]     = useState(false);
  const [ratingChange, setRatingChange] = useState(null);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get(`/duels/${roomCode}`)
      .then(res => {
        setDuel(res.data);
        if (res.data.status === 'finished') {
          setDuelOver(true);
          setWinner(res.data.winner_name);
          setIWon(res.data.winner_id === user.id);
        }
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [roomCode]);

  useEffect(() => {
    if (!user) return;
    socket.connect();

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_room', { roomCode, userId: user.id, username: user.username });
    });
    socket.on('disconnect', () => setConnected(false));

    socket.on('player_joined', ({ username, userId, playerCount }) => {
      setPlayerCount(playerCount);
      if (userId !== user.id) setOpponent({ username, userId });
      if (playerCount >= 2) setWaitingForOpponent(false);
    });

    socket.on('duel_start', ({ problem, players }) => {
      setProblem(problem);
      setWaitingForOpponent(false);
      const opp = players.find(p => p.userId !== user.id);
      if (opp) setOpponent(opp);
    });

    socket.on('opponent_submitting', () => setOpponentSubmitting(true));

    socket.on('opponent_progress', ({ username, passed, total }) => {
      setOpponentSubmitting(false);
      setOpponentProgress({ passed, total });
      if (!opponent) setOpponent({ username });
    });

    socket.on('submission_result', (result) => {
      setIsSubmitting(false);
      setMyResult(result);
    });

    socket.on('duel_over', ({ winnerId, winnerUsername, winnerRatingChange, loserRatingChange }) => {
      setDuelOver(true);
      setWinner(winnerUsername);
      setIWon(winnerId === user.id);
      setRatingChange(winnerId === user.id ? winnerRatingChange : loserRatingChange);
    });

    socket.on('player_left', ({ username }) => {
      console.log(`${username} left the room`);
    });

    return () => {
      socket.off('connect'); socket.off('disconnect');
      socket.off('player_joined'); socket.off('duel_start');
      socket.off('opponent_submitting'); socket.off('opponent_progress');
      socket.off('submission_result'); socket.off('duel_over');
      socket.off('player_left');
      socket.disconnect();
    };
  }, [user, roomCode]);

  const handleSubmit = (code, language) => {
    if (!connected || duelOver) return;
    setIsSubmitting(true);
    setMyResult(null);
    socket.emit('submit_code', { roomCode, userId: user.id, username: user.username, code, language });
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleTest = (i) => setExpandedTests(prev => ({ ...prev, [i]: !prev[i] }));

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={32} className="animate-spin" style={{ color: '#6366f1' }} />
    </div>
  );

  // ── DUEL OVER ──────────────────────────────────────────────────────────────
  if (duelOver) return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4"
         style={{ backgroundColor: '#0f172a' }}>
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">{iWon ? '🏆' : '😔'}</div>
        <h1 className="text-4xl font-bold mb-2" style={{ color: iWon ? '#fbbf24' : '#94a3b8' }}>
          {iWon ? 'You Won!' : 'You Lost'}
        </h1>
        <p className="text-lg mb-8" style={{ color: '#64748b' }}>
          {iWon ? 'Incredible. You solved it first!' : `${winner} solved it faster. Train harder!`}
        </p>
        {myResult && !myResult.error && (
          <div className="mb-6 p-4 rounded-xl border"
               style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
            <div className="text-sm mb-1" style={{ color: '#64748b' }}>Your score</div>
            <div className="text-2xl font-bold"
                 style={{ color: myResult.status === 'accepted' ? '#4ade80' : '#f87171' }}>
              {myResult.passed}/{myResult.total} tests passed
            </div>
          </div>
        )}
        {ratingChange !== null && (
          <div className="mb-4 p-3 rounded-xl border text-center"
               style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
            <div className="text-sm mb-1" style={{ color: '#64748b' }}>Rating Change</div>
            <div className="text-2xl font-bold"
                 style={{ color: ratingChange > 0 ? '#4ade80' : '#f87171' }}>
              {ratingChange > 0 ? '+' : ''}{ratingChange}
            </div>
          </div>
        )}
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate('/')}
            className="px-6 py-3 rounded-xl font-semibold"
            style={{ backgroundColor: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }}>
            Back to Problems
          </button>
          <button onClick={() => navigate('/leaderboard')}
            className="px-6 py-3 rounded-xl font-semibold flex items-center gap-2"
            style={{ backgroundColor: '#6366f1', color: 'white' }}>
            <Trophy size={18} /> Leaderboard
          </button>
        </div>
      </div>
    </div>
  );

  // ── WAITING FOR OPPONENT ───────────────────────────────────────────────────
  if (waitingForOpponent) return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4"
         style={{ backgroundColor: '#0f172a' }}>
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
             style={{ backgroundColor: '#1e293b' }}>
          <Users size={36} style={{ color: '#6366f1' }} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Waiting for Opponent</h2>
        <p className="mb-8" style={{ color: '#64748b' }}>Share the room code with your opponent to start.</p>

        <div className="p-6 rounded-2xl border mb-6"
             style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
          <div className="text-xs font-medium mb-3 uppercase tracking-widest" style={{ color: '#64748b' }}>Room Code</div>
          <div className="text-4xl font-bold font-mono tracking-widest mb-4" style={{ color: '#818cf8' }}>
            {roomCode}
          </div>
          <button onClick={copyRoomCode}
            className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl text-sm font-medium"
            style={{ backgroundColor: '#1e1b4b', color: '#818cf8', border: '1px solid #3730a3' }}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm"
             style={{ color: connected ? '#4ade80' : '#f87171' }}>
          {connected ? <><Wifi size={14} /> Connected</> : <><WifiOff size={14} /> Connecting…</>}
        </div>
        <div className="mt-4 flex items-center gap-2 justify-center">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#6366f1' }} />
          <span className="text-sm" style={{ color: '#64748b' }}>{playerCount}/2 players</span>
        </div>
      </div>
    </div>
  );

  // ── ACTIVE DUEL ────────────────────────────────────────────────────────────
  const myPassed  = myResult?.passed ?? 0;
  const myTotal   = myResult?.total  ?? 1;
  const oppPassed = opponentProgress.passed;
  const oppTotal  = opponentProgress.total || myTotal;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col" style={{ backgroundColor: '#0f172a' }}>

      {/* Duel Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b"
           style={{ borderColor: '#1e293b', backgroundColor: '#0f172a' }}>
        <div className="flex items-center gap-3">
          <Swords size={18} style={{ color: '#6366f1' }} />
          <span className="font-bold text-white">AlgoClash</span>
          <button onClick={copyRoomCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold"
            style={{ backgroundColor: '#1e1b4b', color: '#818cf8', border: '1px solid #3730a3' }}>
            {roomCode} {copied ? <Check size={11} /> : <Copy size={11} />}
          </button>
        </div>

        {/* Progress bars */}
        <div className="flex items-center gap-6 flex-1 max-w-xl mx-8">
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium" style={{ color: '#818cf8' }}>{user.username} (You)</span>
              <span style={{ color: '#64748b' }}>{myResult ? `${myPassed}/${myTotal}` : '–'}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#1e293b' }}>
              <div className="h-full rounded-full transition-all duration-500"
                   style={{
                     width: myResult ? `${(myPassed / myTotal) * 100}%` : '0%',
                     backgroundColor: myResult?.status === 'accepted' ? '#22c55e' : '#6366f1',
                   }} />
            </div>
          </div>

          <div className="font-bold text-lg" style={{ color: '#334155' }}>VS</div>

          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium" style={{ color: '#f59e0b' }}>
                {opponent?.username || 'Opponent'}
              </span>
              <span style={{ color: '#64748b' }}>
                {opponentProgress.total > 0 ? `${oppPassed}/${oppTotal}` : '–'}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#1e293b' }}>
              <div className="h-full rounded-full transition-all duration-500"
                   style={{
                     width:           oppTotal > 0 ? `${(oppPassed / oppTotal) * 100}%` : '0%',
                     backgroundColor: oppPassed === oppTotal && oppTotal > 0 ? '#22c55e' : '#f59e0b',
                   }} />
            </div>
            {opponentSubmitting && (
              <div className="text-xs mt-0.5 flex items-center gap-1" style={{ color: '#f59e0b' }}>
                <Loader2 size={10} className="animate-spin" /> Submitting…
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs"
             style={{ color: connected ? '#4ade80' : '#f87171' }}>
          {connected ? <Wifi size={13} /> : <WifiOff size={13} />}
          {connected ? 'Live' : 'Reconnecting…'}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex min-h-0">
        {/* Left — Problem */}
        <div className="w-[42%] border-r overflow-y-auto p-5"
             style={{ borderColor: '#1e293b' }}>
          {problem ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-bold text-white">{problem.title}</h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        color:           problem.difficulty === 'Easy' ? '#4ade80' : problem.difficulty === 'Hard' ? '#f87171' : '#fb923c',
                        backgroundColor: problem.difficulty === 'Easy' ? '#052e16' : problem.difficulty === 'Hard' ? '#450a0a' : '#431407',
                      }}>
                  {problem.difficulty}
                </span>
              </div>

              {/* Markdown description */}
              <MarkdownRenderer content={problem.description} />

              {/* Sample test cases */}
              {problem.sampleTests?.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-white mb-3">Examples</h3>
                  {problem.sampleTests.map((tc, i) => (
                    <div key={i} className="mb-3 rounded-lg overflow-hidden border"
                         style={{ borderColor: '#334155', backgroundColor: '#0f172a' }}>
                      <div className="grid grid-cols-2 text-xs">
                        <div className="p-3 border-r" style={{ borderColor: '#334155' }}>
                          <div className="font-medium mb-1" style={{ color: '#64748b' }}>Input</div>
                          <pre className="font-mono whitespace-pre-wrap" style={{ color: '#a5f3fc' }}>{tc.input}</pre>
                        </div>
                        <div className="p-3">
                          <div className="font-medium mb-1" style={{ color: '#64748b' }}>Output</div>
                          <pre className="font-mono whitespace-pre-wrap" style={{ color: '#86efac' }}>{tc.expected_output}</pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* My results */}
              {myResult && !myResult.error && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white">Your Submission</h3>
                    <span className="text-sm font-bold"
                          style={{ color: myResult.status === 'accepted' ? '#4ade80' : '#f59e0b' }}>
                      {myResult.passed}/{myResult.total}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {myResult.results?.map((r, i) => (
                      <div key={i} className="rounded-lg border overflow-hidden"
                           style={{ borderColor: r.passed ? '#166534' : '#7f1d1d' }}>
                        <button onClick={() => toggleTest(i)}
                          className="w-full flex items-center justify-between px-3 py-2 text-left text-sm"
                          style={{ backgroundColor: r.passed ? '#052e16' : '#450a0a' }}>
                          <div className="flex items-center gap-2">
                            {r.passed
                              ? <CheckCircle2 size={13} style={{ color: '#4ade80' }} />
                              : <XCircle      size={13} style={{ color: '#f87171' }} />
                            }
                            <span style={{ color: r.passed ? '#4ade80' : '#f87171' }}>Test {i + 1}</span>
                            <span className="text-xs" style={{ color: '#64748b' }}>{r.status}</span>
                          </div>
                          {expandedTests[i]
                            ? <ChevronUp   size={12} style={{ color: '#64748b' }} />
                            : <ChevronDown size={12} style={{ color: '#64748b' }} />
                          }
                        </button>
                        {expandedTests[i] && (
                          <div className="p-3 grid grid-cols-3 gap-2 text-xs"
                               style={{ backgroundColor: '#0f172a' }}>
                            <div>
                              <div className="font-medium mb-1" style={{ color: '#64748b' }}>Input</div>
                              <pre className="font-mono whitespace-pre-wrap" style={{ color: '#a5f3fc' }}>{r.input}</pre>
                            </div>
                            <div>
                              <div className="font-medium mb-1" style={{ color: '#64748b' }}>Expected</div>
                              <pre className="font-mono whitespace-pre-wrap" style={{ color: '#86efac' }}>{r.expected}</pre>
                            </div>
                            <div>
                              <div className="font-medium mb-1" style={{ color: '#64748b' }}>Actual</div>
                              <pre className="font-mono whitespace-pre-wrap"
                                   style={{ color: r.passed ? '#86efac' : '#fca5a5' }}>
                                {r.actual || r.error || r.stderr || '(empty)'}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {myResult?.error && (
                <div className="mt-4 p-3 rounded-lg border" style={{ backgroundColor: '#450a0a', borderColor: '#7f1d1d' }}>
                  <p className="text-sm" style={{ color: '#fca5a5' }}>{myResult.error}</p>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 size={28} className="animate-spin mx-auto mb-3" style={{ color: '#6366f1' }} />
                <p style={{ color: '#64748b' }}>Loading problem…</p>
              </div>
            </div>
          )}
        </div>

        {/* Right — Editor */}
        <div className="flex-1 p-3">
          <Editor
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            disabled={duelOver || !problem}
          />
        </div>
      </div>
    </div>
  );
}