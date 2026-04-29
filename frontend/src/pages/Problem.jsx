import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm    from 'remark-gfm';
import api from '../api/axios.js';
import Editor from '../components/Editor.jsx';
import {
  ArrowLeft, CheckCircle2, XCircle, Loader2,
  Terminal, ChevronDown, ChevronUp, Swords,
} from 'lucide-react';

const DIFFICULTY_STYLE = {
  Easy:   { color: '#4ade80', bg: '#052e16' },
  Medium: { color: '#fb923c', bg: '#431407' },
  Hard:   { color: '#f87171', bg: '#450a0a' },
};

function MarkdownRenderer({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2" style={{ color: '#e2e8f0' }}>{children}</h1>,
        h2: ({ children }) => <h2 className="text-base font-bold mt-4 mb-2" style={{ color: '#818cf8' }}>{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-bold mt-3 mb-1" style={{ color: '#a5b4fc' }}>{children}</h3>,
        p:  ({ children }) => <p className="mb-2 leading-relaxed" style={{ color: '#cbd5e1' }}>{children}</p>,
        strong: ({ children }) => <strong style={{ color: '#e2e8f0', fontWeight: 600 }}>{children}</strong>,
        em:     ({ children }) => <em style={{ color: '#94a3b8' }}>{children}</em>,
        ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2 ml-2">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2 ml-2">{children}</ol>,
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
        blockquote: ({ children }) => (
          <blockquote className="pl-3 my-2 border-l-2" style={{ borderColor: '#6366f1', color: '#94a3b8' }}>
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-2">
            <table className="text-sm border-collapse w-full">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="px-3 py-1.5 text-left text-xs font-semibold"
              style={{ backgroundColor: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }}>
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-1.5 text-xs"
              style={{ color: '#cbd5e1', border: '1px solid #334155' }}>
            {children}
          </td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export default function Problem() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [problem, setProblem]  = useState(null);
  const [loading, setLoading]  = useState(true);

  const [runResult,     setRunResult]     = useState(null);
  const [submitResult,  setSubmitResult]  = useState(null);
  const [aiResult,      setAiResult]      = useState(null);
  const [isRunning,     setIsRunning]     = useState(false);
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [isAskingAI,    setIsAskingAI]    = useState(false);
  const [activeTab,     setActiveTab]     = useState('description');
  const [expandedTests, setExpandedTests] = useState({});

  useEffect(() => {
    api.get(`/problems/${id}`)
      .then(res => setProblem(res.data))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleRun = async (code, language) => {
    setIsRunning(true); setRunResult(null); setActiveTab('results');
    try {
      const input = problem?.sampleTestCases?.[0]?.input || '';
      const res   = await api.post('/problems/run', { code, language, input });
      setRunResult(res.data);
    } catch (err) {
      setRunResult({ error: err.response?.data?.message || 'Run failed.' });
    } finally { setIsRunning(false); }
  };

  const handleSubmit = async (code, language) => {
    setIsSubmitting(true); setSubmitResult(null); setActiveTab('results');
    try {
      const res = await api.post('/problems/submit', { problemId: id, code, language });
      setSubmitResult(res.data);
    } catch (err) {
      setSubmitResult({ error: err.response?.data?.message || 'Submission failed.' });
    } finally { setIsSubmitting(false); }
  };

  const handleAskAI = async (code, language) => {
    setIsAskingAI(true); setAiResult(null); setActiveTab('ai');
    try {
      const res = await api.post('/ai/analyze', { 
        title: problem.title, 
        description: problem.description,
        code, 
        language 
      });
      setAiResult(res.data.analysis);
    } catch (err) {
      setAiResult('Error: ' + (err.response?.data?.message || 'AI analysis failed.'));
    } finally { setIsAskingAI(false); }
  };

  const toggleTest = (i) => setExpandedTests(prev => ({ ...prev, [i]: !prev[i] }));

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={32} className="animate-spin" style={{ color: '#6366f1' }} />
    </div>
  );

  if (!problem) return null;

  const ds = DIFFICULTY_STYLE[problem.difficulty] || DIFFICULTY_STYLE.Medium;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b"
           style={{ borderColor: '#1e293b', backgroundColor: '#0f172a' }}>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: '#64748b' }}
            onMouseEnter={e => e.currentTarget.style.color = '#e2e8f0'}
            onMouseLeave={e => e.currentTarget.style.color = '#64748b'}>
            <ArrowLeft size={16} /> Problems
          </button>
          <div className="w-px h-4" style={{ backgroundColor: '#334155' }} />
          <span className="font-semibold text-white">{problem.title}</span>
          <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ color: ds.color, backgroundColor: ds.bg }}>
            {problem.difficulty}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={async () => {
            try {
              const res = await api.post('/marks/toggle', { problemId: problem.id });
              setProblem(prev => ({ ...prev, marked: res.data.marked }));
            } catch (err) {
              alert('Failed to toggle mark');
            }
          }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ 
              backgroundColor: problem.marked ? '#422006' : 'transparent', 
              color: problem.marked ? '#fcd34d' : '#94a3b8', 
              border: `1px solid ${problem.marked ? '#b45309' : '#334155'}` 
            }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={problem.marked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
            {problem.marked ? 'Marked' : 'Mark Important'}
          </button>
          
          <button onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: '#1e1b4b', color: '#818cf8', border: '1px solid #3730a3' }}>
            <Swords size={14} /> Duel Mode
          </button>
        </div>
      </div>

      {/* Split layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left — Problem panel */}
        <div className="w-[45%] flex flex-col border-r overflow-hidden"
             style={{ borderColor: '#1e293b' }}>
          {/* Tabs */}
          <div className="flex border-b" style={{ borderColor: '#1e293b' }}>
            {[{ key: 'description', label: 'Description' }, { key: 'results', label: 'Results' }, { key: 'ai', label: 'AI Tutor ✨' }].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className="px-5 py-3 text-sm font-medium border-b-2 transition-colors"
                style={{
                  borderBottomColor: activeTab === tab.key ? '#6366f1' : 'transparent',
                  color:             activeTab === tab.key ? '#818cf8'  : '#64748b',
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {/* DESCRIPTION TAB */}
            {activeTab === 'description' && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-xl font-bold text-white">{problem.title}</h2>
                </div>

                {/* Render markdown description */}
                <MarkdownRenderer content={problem.description} />

                {/* Sample test cases */}
                {problem.sampleTestCases?.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-white mb-3">Sample Test Cases</h3>
                    {problem.sampleTestCases.map((tc, i) => (
                      <div key={i} className="mb-3 rounded-lg overflow-hidden border"
                           style={{ borderColor: '#334155' }}>
                        <div className="grid grid-cols-2 divide-x divide-slate-700">
                          <div className="p-3" style={{ backgroundColor: '#0f172a' }}>
                            <div className="text-xs font-medium mb-1.5" style={{ color: '#64748b' }}>Input</div>
                            <pre className="text-xs font-mono whitespace-pre-wrap" style={{ color: '#a5f3fc' }}>
                              {tc.input}
                            </pre>
                          </div>
                          <div className="p-3" style={{ backgroundColor: '#0f172a' }}>
                            <div className="text-xs font-medium mb-1.5" style={{ color: '#64748b' }}>Expected Output</div>
                            <pre className="text-xs font-mono whitespace-pre-wrap" style={{ color: '#86efac' }}>
                              {tc.expected_output}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AI TUTOR TAB */}
            {activeTab === 'ai' && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <span style={{ color: '#c084fc' }}>✨ AI Tutor Analysis</span>
                </h3>
                
                {isAskingAI ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Loader2 size={28} className="animate-spin" style={{ color: '#c084fc' }} />
                    <p style={{ color: '#a855f7' }}>Gemini is analyzing your code...</p>
                  </div>
                ) : aiResult ? (
                  <div className="p-4 rounded-lg border" style={{ backgroundColor: '#1e1b4b', borderColor: '#4c1d95' }}>
                    <MarkdownRenderer content={aiResult} />
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <p style={{ color: '#475569' }}>Click the "Ask AI" button in the editor to get help.</p>
                  </div>
                )}
              </div>
            )}

            {/* RESULTS TAB */}
            {activeTab === 'results' && (
              <div>
                {/* Run result */}
                {runResult && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Terminal size={14} style={{ color: '#67e8f9' }} /> Run Output
                    </h3>
                    <div className="rounded-lg p-4 border"
                         style={{ backgroundColor: '#0f172a', borderColor: '#334155' }}>
                      {runResult.error ? (
                        <p className="text-sm font-mono" style={{ color: '#f87171' }}>{runResult.error}</p>
                      ) : (
                        <>
                          <pre className="text-sm font-mono whitespace-pre-wrap" style={{ color: '#a5f3fc' }}>
                            {runResult.stdout || '(no output)'}
                          </pre>
                          {runResult.stderr && (
                            <pre className="text-sm font-mono mt-2 whitespace-pre-wrap" style={{ color: '#fca5a5' }}>
                              {runResult.stderr}
                            </pre>
                          )}
                          <div className="text-xs mt-3" style={{ color: '#64748b' }}>
                            Status: {runResult.status}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Submit result */}
                {submitResult && (
                  <div>
                    {submitResult.error ? (
                      <div className="p-4 rounded-lg border" style={{ backgroundColor: '#450a0a', borderColor: '#7f1d1d' }}>
                        <p className="text-sm" style={{ color: '#fca5a5' }}>{submitResult.error}</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-white">Submission Results</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold"
                                  style={{ color: submitResult.status === 'accepted' ? '#4ade80' : '#f87171' }}>
                              {submitResult.passed}/{submitResult.total} Passed
                            </span>
                            {submitResult.status === 'accepted'
                              ? <CheckCircle2 size={18} style={{ color: '#4ade80' }} />
                              : <XCircle      size={18} style={{ color: '#f87171' }} />
                            }
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full h-2 rounded-full mb-4 overflow-hidden"
                             style={{ backgroundColor: '#334155' }}>
                          <div className="h-full rounded-full transition-all duration-700"
                               style={{
                                 width: `${(submitResult.passed / submitResult.total) * 100}%`,
                                 backgroundColor: submitResult.status === 'accepted' ? '#22c55e' : '#f59e0b',
                               }} />
                        </div>

                        {/* Per-test breakdown */}
                        <div className="space-y-2">
                          {submitResult.results?.map((r, i) => (
                            <div key={i} className="rounded-lg border overflow-hidden"
                                 style={{ borderColor: r.passed ? '#166534' : '#7f1d1d' }}>
                              <button onClick={() => toggleTest(i)}
                                className="w-full flex items-center justify-between p-3 text-left"
                                style={{ backgroundColor: r.passed ? '#052e16' : '#450a0a' }}>
                                <div className="flex items-center gap-2.5">
                                  {r.passed
                                    ? <CheckCircle2 size={15} style={{ color: '#4ade80' }} />
                                    : <XCircle      size={15} style={{ color: '#f87171' }} />
                                  }
                                  <span className="text-sm font-medium"
                                        style={{ color: r.passed ? '#4ade80' : '#f87171' }}>
                                    Test {i + 1}
                                  </span>
                                  <span className="text-xs" style={{ color: '#64748b' }}>{r.status}</span>
                                </div>
                                {expandedTests[i]
                                  ? <ChevronUp   size={14} style={{ color: '#64748b' }} />
                                  : <ChevronDown size={14} style={{ color: '#64748b' }} />
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
                      </>
                    )}
                  </div>
                )}

                {!runResult && !submitResult && !isRunning && !isSubmitting && (
                  <div className="text-center py-16">
                    <Terminal size={32} className="mx-auto mb-3" style={{ color: '#334155' }} />
                    <p style={{ color: '#475569' }}>Run or submit your code to see results here.</p>
                  </div>
                )}

                {(isRunning || isSubmitting) && (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Loader2 size={28} className="animate-spin" style={{ color: '#6366f1' }} />
                    <p style={{ color: '#64748b' }}>
                      {isRunning ? 'Running against sample…' : 'Judging all test cases…'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right — Editor */}
        <div className="flex-1 flex flex-col min-h-0 p-3">
          <Editor
            onRun={handleRun}
            onSubmit={handleSubmit}
            onAskAI={handleAskAI}
            isRunning={isRunning}
            isSubmitting={isSubmitting}
            isAskingAI={isAskingAI}
          />
        </div>
      </div>
    </div>
  );
}