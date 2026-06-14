import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm    from 'remark-gfm';
import api from '../api/axios.js';
import {
  Plus, Trash2, Loader2, CheckCircle2,
  XCircle, Code2, ShieldCheck, Eye, Edit3,
} from 'lucide-react';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const PREDEFINED_TAGS = ['Arrays', 'Strings', 'Math', 'Dynamic Programming', 'Graphs', 'Trees', 'Greedy', 'Binary Search', 'Sorting', 'Two Pointers'];
const emptyProblem  = { title: '', description: '', difficulty: 'Medium', tags: [], isPublic: true };
const emptyTestCase = { input: '', expectedOutput: '', isSample: true };

const inputStyle = {
  backgroundColor: '#0f172a',
  border: '1px solid #334155',
  color: 'white',
};

const DESCRIPTION_TEMPLATE = `## Problem Statement
Describe the problem clearly here. Use **bold** for important terms and \`code\` for variables.

## Input Format
- First line: integer \`n\` (1 ≤ n ≤ 10^5)
- Second line: n integers \`a_1, a_2, ..., a_n\`

## Output Format
Print the answer on a single line.

## Constraints
- 1 ≤ n ≤ 2×10^5
- 1 ≤ a_i ≤ 10^9`;

export default function Admin() {
  const [problems,    setProblems]   = useState([]);
  const [loading,     setLoading]    = useState(true);
  const [activeTab,   setActiveTab]  = useState('manual');
  const [form,        setForm]       = useState(emptyProblem);
  const [testCases,   setTestCases]  = useState([{ ...emptyTestCase }]);
  const [saving,      setSaving]     = useState(false);
  const [saveMsg,     setSaveMsg]    = useState(null);
  const [previewMode, setPreviewMode]= useState(false);
  const [deletingId,  setDeletingId] = useState(null);

  const fetchProblems = () => {
    api.get('/problems')
      .then(res => setProblems(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProblems(); }, []);

  const handleSave = async () => {
    if (!form.title || !form.description) {
      setSaveMsg({ type: 'error', text: 'Title and description are required.' });
      return;
    }
    if (testCases.some(tc => !tc.input.trim() || !tc.expectedOutput.trim())) {
      setSaveMsg({ type: 'error', text: 'All test cases must have input and expected output.' });
      return;
    }
    setSaving(true);
    setSaveMsg(null);
    try {
      await api.post('/problems', { ...form, testCases });
      setSaveMsg({ type: 'success', text: 'Problem created successfully!' });
      setForm(emptyProblem);
      setTestCases([{ ...emptyTestCase }]);
      setPreviewMode(false);
      fetchProblems();
    } catch (err) {
      setSaveMsg({ type: 'error', text: err.response?.data?.message || 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this problem and all its test cases?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/problems/${id}`);
      setProblems(prev => prev.filter(p => p.id !== id));
    } catch {
      alert('Delete failed.');
    } finally {
      setDeletingId(null);
    }
  };

  const addTestCase    = () => setTestCases(prev => [...prev, { ...emptyTestCase }]);
  const updateTestCase = (idx, field, value) =>
    setTestCases(prev => prev.map((tc, i) => i === idx ? { ...tc, [field]: value } : tc));
  const removeTestCase = (idx) =>
    setTestCases(prev => prev.filter((_, i) => i !== idx));

  const Alert = ({ msg }) => msg ? (
    <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-lg text-sm"
         style={{
           backgroundColor: msg.type === 'success' ? '#052e16' : '#450a0a',
           color:           msg.type === 'success' ? '#4ade80' : '#fca5a5',
           border:          `1px solid ${msg.type === 'success' ? '#166534' : '#7f1d1d'}`,
         }}>
      {msg.type === 'success' ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
      {msg.text}
    </div>
  ) : null;

  const DifficultyPicker = ({ value, onChange }) => (
    <div className="flex gap-3">
      {DIFFICULTIES.map(d => (
        <button key={d} onClick={() => onChange(d)}
          className="px-5 py-2 rounded-lg text-sm font-medium transition-all border"
          style={{
            backgroundColor: value === d
              ? (d==='Easy' ? '#052e16' : d==='Hard' ? '#450a0a' : '#431407')
              : '#0f172a',
            color: value === d
              ? (d==='Easy' ? '#4ade80' : d==='Hard' ? '#f87171' : '#fb923c')
              : '#64748b',
            borderColor: value === d
              ? (d==='Easy' ? '#166534' : d==='Hard' ? '#7f1d1d' : '#9a3412')
              : '#334155',
          }}>
          {d}
        </button>
      ))}
    </div>
  );

  const tabs = [
    { key: 'manual', label: '+ Add Problem'                    },
    { key: 'list',   label: `📋 Problems (${problems.length})` },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 rounded-xl" style={{ backgroundColor: '#1e293b' }}>
          <ShieldCheck size={24} style={{ color: '#fb923c' }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-sm" style={{ color: '#64748b' }}>Manage problems and test cases</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ backgroundColor: '#1e293b' }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: activeTab === tab.key ? '#6366f1' : 'transparent',
              color:           activeTab === tab.key ? 'white'    : '#94a3b8',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── ADD PROBLEM ────────────────────────────────────────────────────── */}
      {activeTab === 'manual' && (
        <div className="rounded-2xl p-6 border"
             style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
          <h2 className="text-lg font-semibold text-white mb-5">Add New Problem</h2>
          <Alert msg={saveMsg} />

          <div className="space-y-5">

            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>
                Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. The Equalizer"
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e  => e.target.style.borderColor = '#334155'}
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>
                  Tags (Select multiple)
                </label>
                <div className="flex flex-wrap gap-2 p-3 rounded-lg border" style={{ backgroundColor: '#0f172a', borderColor: '#334155' }}>
                  {PREDEFINED_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        const newTags = form.tags.includes(tag) 
                          ? form.tags.filter(t => t !== tag) 
                          : [...form.tags, tag];
                        setForm({ ...form, tags: newTags });
                      }}
                      className="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
                      style={{
                        backgroundColor: form.tags.includes(tag) ? '#312e81' : '#1e293b',
                        borderColor: form.tags.includes(tag) ? '#6366f1' : '#334155',
                        color: form.tags.includes(tag) ? '#a5b4fc' : '#94a3b8'
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer" style={{ color: '#94a3b8' }}>
                  <input
                    type="checkbox"
                    checked={form.isPublic}
                    onChange={e => setForm({ ...form, isPublic: e.target.checked })}
                    className="accent-indigo-500 w-4 h-4"
                  />
                  Public Problem
                </label>
              </div>
            </div>

            {/* Description with Write/Preview toggle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium" style={{ color: '#94a3b8' }}>
                  Description *{' '}
                  <span style={{ color: '#475569', fontWeight: 'normal' }}>
                    (Markdown supported)
                  </span>
                </label>
                <div className="flex gap-1 p-0.5 rounded-lg" style={{ backgroundColor: '#0f172a' }}>
                  <button
                    onClick={() => setPreviewMode(false)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all"
                    style={{
                      backgroundColor: !previewMode ? '#6366f1' : 'transparent',
                      color:           !previewMode ? 'white'    : '#64748b',
                    }}>
                    <Edit3 size={11} /> Write
                  </button>
                  <button
                    onClick={() => setPreviewMode(true)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all"
                    style={{
                      backgroundColor: previewMode ? '#6366f1' : 'transparent',
                      color:           previewMode ? 'white'   : '#64748b',
                    }}>
                    <Eye size={11} /> Preview
                  </button>
                </div>
              </div>

              {!previewMode ? (
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder={DESCRIPTION_TEMPLATE}
                  rows={12}
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none resize-none font-mono transition-all"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e  => e.target.style.borderColor = '#334155'}
                />
              ) : (
                <div
                  className="w-full px-4 py-3 rounded-lg text-sm min-h-48 overflow-auto"
                  style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}>
                  {form.description
                    ? <MarkdownRenderer content={form.description} />
                    : <p style={{ color: '#475569', fontStyle: 'italic' }}>Nothing to preview yet...</p>
                  }
                </div>
              )}

              {/* Markdown cheatsheet */}
              <div className="mt-2 flex flex-wrap gap-4 text-xs" style={{ color: '#475569' }}>
                <span><code className="px-1 rounded" style={{ backgroundColor: '#0f172a' }}>**bold**</code> bold</span>
                <span><code className="px-1 rounded" style={{ backgroundColor: '#0f172a' }}>`code`</code> inline code</span>
                <span><code className="px-1 rounded" style={{ backgroundColor: '#0f172a' }}>## Heading</code> section</span>
                <span><code className="px-1 rounded" style={{ backgroundColor: '#0f172a' }}>- item</code> bullet list</span>
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>
                Difficulty
              </label>
              <DifficultyPicker
                value={form.difficulty}
                onChange={v => setForm({ ...form, difficulty: v })}
              />
            </div>

            {/* Test Cases */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <label className="text-sm font-medium" style={{ color: '#94a3b8' }}>
                    Test Cases
                  </label>
                  <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
                    Make sure input and expected output are exact — no extra spaces or blank lines.
                  </p>
                </div>
                <button
                  onClick={addTestCase}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                  style={{ backgroundColor: '#1e1b4b', color: '#818cf8', border: '1px solid #3730a3' }}>
                  <Plus size={12} /> Add Test Case
                </button>
              </div>

              <div className="space-y-3">
                {testCases.map((tc, i) => (
                  <div key={i} className="p-4 rounded-xl border"
                       style={{ backgroundColor: '#0f172a', borderColor: '#334155' }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded"
                            style={{ backgroundColor: '#1e293b', color: '#64748b' }}>
                        Test Case {i + 1}
                      </span>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-1.5 text-xs cursor-pointer"
                               style={{ color: '#94a3b8' }}>
                          <input
                            type="checkbox"
                            checked={tc.isSample}
                            onChange={e => updateTestCase(i, 'isSample', e.target.checked)}
                            className="accent-indigo-500"
                          />
                          Show as sample to students
                        </label>
                        {testCases.length > 1 && (
                          <button
                            onClick={() => removeTestCase(i)}
                            className="p-1 rounded transition-colors"
                            style={{ color: '#64748b' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                            onMouseLeave={e => e.currentTarget.style.color = '#64748b'}>
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium" style={{ color: '#475569' }}>Input</span>
                          <span className="text-xs" style={{ color: '#334155' }}>
                            {tc.input ? `${tc.input.split('\n').length} lines` : ''}
                          </span>
                        </div>
                        <textarea
                          value={tc.input}
                          onChange={e => updateTestCase(i, 'input', e.target.value)}
                          rows={5}
                          placeholder={`4\n1 1\n1\n2 67\n67 67`}
                          className="w-full px-3 py-2 rounded-lg text-xs outline-none resize-none font-mono transition-all"
                          style={inputStyle}
                          onFocus={e => e.target.style.borderColor = '#6366f1'}
                          onBlur={e  => e.target.style.borderColor = '#334155'}
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium" style={{ color: '#475569' }}>Expected Output</span>
                          <span className="text-xs" style={{ color: '#334155' }}>
                            {tc.expectedOutput ? `${tc.expectedOutput.split('\n').length} lines` : ''}
                          </span>
                        </div>
                        <textarea
                          value={tc.expectedOutput}
                          onChange={e => updateTestCase(i, 'expectedOutput', e.target.value)}
                          rows={5}
                          placeholder={`YES\nYES\nYES\nNO`}
                          className="w-full px-3 py-2 rounded-lg text-xs outline-none resize-none font-mono transition-all"
                          style={inputStyle}
                          onFocus={e => e.target.style.borderColor = '#6366f1'}
                          onBlur={e  => e.target.style.borderColor = '#334155'}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              style={{ backgroundColor: '#6366f1', color: 'white' }}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {saving ? 'Saving…' : 'Create Problem'}
            </button>
          </div>
        </div>
      )}

      {/* ── PROBLEM LIST ────────────────────────────────────────────────────── */}
      {activeTab === 'list' && (
        <div className="rounded-2xl overflow-hidden border"
             style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin" style={{ color: '#6366f1' }} />
            </div>
          ) : problems.length === 0 ? (
            <div className="text-center py-16">
              <Code2 size={36} className="mx-auto mb-3" style={{ color: '#334155' }} />
              <p style={{ color: '#64748b' }}>No problems yet. Add one!</p>
            </div>
          ) : (
            problems.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center gap-4 px-5 py-4 border-b transition-colors"
                style={{ borderColor: '#334155' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0f172a'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <span className="text-sm font-mono w-6 text-center" style={{ color: '#475569' }}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">{p.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                    {p.test_count} test case{p.test_count !== 1 ? 's' : ''} · Manual
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{
                        color:           p.difficulty === 'Easy' ? '#4ade80' : p.difficulty === 'Hard' ? '#f87171' : '#fb923c',
                        backgroundColor: p.difficulty === 'Easy' ? '#052e16' : p.difficulty === 'Hard' ? '#450a0a' : '#431407',
                      }}>
                  {p.difficulty}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{
                        color:           p.is_public ? '#cbd5e1' : '#fca5a5',
                        backgroundColor: p.is_public ? '#334155' : '#7f1d1d',
                      }}>
                  {p.is_public ? 'Public' : 'Private'}
                </span>
                <button
                  onClick={() => handleDelete(p.id)}
                  disabled={deletingId === p.id}
                  className="p-2 rounded-lg transition-colors disabled:opacity-40"
                  style={{ color: '#64748b' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                  onMouseLeave={e => e.currentTarget.style.color = '#64748b'}>
                  {deletingId === p.id
                    ? <Loader2 size={15} className="animate-spin" />
                    : <Trash2  size={15} />
                  }
                </button>
              </div>
            ))
          )}
        </div>
      )}


    </div>
  );
}

// ── Shared Markdown Renderer ──────────────────────────────────────────────────
export function MarkdownRenderer({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-xl font-bold mt-4 mb-2" style={{ color: '#e2e8f0' }}>{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-bold mt-4 mb-2" style={{ color: '#818cf8' }}>{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-bold mt-3 mb-1" style={{ color: '#a5b4fc' }}>{children}</h3>
        ),
        p: ({ children }) => (
          <p className="mb-2 leading-relaxed" style={{ color: '#cbd5e1' }}>{children}</p>
        ),
        strong: ({ children }) => (
          <strong style={{ color: '#e2e8f0', fontWeight: 600 }}>{children}</strong>
        ),
        em: ({ children }) => (
          <em style={{ color: '#94a3b8' }}>{children}</em>
        ),
        ul: ({ children }) => (
          <ul className="list-disc list-inside space-y-1 mb-2 ml-2">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside space-y-1 mb-2 ml-2">{children}</ol>
        ),
        li: ({ children }) => (
          <li style={{ color: '#cbd5e1' }}>{children}</li>
        ),
        code: ({ inline, children }) =>
          inline ? (
            <code
              className="px-1.5 py-0.5 rounded text-xs font-mono"
              style={{ backgroundColor: '#334155', color: '#a5f3fc' }}>
              {children}
            </code>
          ) : (
            <pre
              className="p-3 rounded-lg overflow-x-auto my-2"
              style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}>
              <code className="text-xs font-mono" style={{ color: '#a5f3fc' }}>
                {children}
              </code>
            </pre>
          ),
        blockquote: ({ children }) => (
          <blockquote
            className="pl-3 my-2 border-l-2"
            style={{ borderColor: '#6366f1', color: '#94a3b8' }}>
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-2">
            <table className="text-sm border-collapse w-full">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th
            className="px-3 py-1.5 text-left text-xs font-semibold"
            style={{ backgroundColor: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }}>
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td
            className="px-3 py-1.5 text-xs"
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