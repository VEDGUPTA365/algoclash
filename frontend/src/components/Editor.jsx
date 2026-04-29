import { useState, useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { Play, Send, Loader2, ChevronDown } from 'lucide-react';

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', monacoId: 'javascript' },
  { id: 'python',     label: 'Python',     monacoId: 'python'     },
  { id: 'cpp',        label: 'C++',        monacoId: 'cpp'        },
  { id: 'c',          label: 'C',          monacoId: 'c'          },
  { id: 'java',       label: 'Java',       monacoId: 'java'       },
  { id: 'go',         label: 'Go',         monacoId: 'go'         },
  { id: 'rust',       label: 'Rust',       monacoId: 'rust'       },
];

const STARTERS = {
  javascript: `// Write your solution here\nfunction solution(input) {\n  // your code\n}\n\nconst lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\nconsole.log(solution(lines[0]));`,
  python:     `import sys\ninput_data = sys.stdin.read().strip()\n\n# Write your solution here\ndef solution(data):\n    pass\n\nprint(solution(input_data))`,
  cpp:        `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    \n    // Write your solution here\n    \n    return 0;\n}`,
  c:          `#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    \n    return 0;\n}`,
  java:       `import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // Write your solution here\n    }\n}`,
  go:         `package main\n\nimport (\n    "bufio"\n    "fmt"\n    "os"\n)\n\nfunc main() {\n    reader := bufio.NewReader(os.Stdin)\n    _ = reader\n    // Write your solution here\n    fmt.Println()\n}`,
  rust:       `use std::io::{self, BufRead};\n\nfn main() {\n    let stdin = io::stdin();\n    let mut lines = stdin.lock().lines();\n    // Write your solution here\n}`,
};

export default function Editor({
  onRun,
  onSubmit,
  onAskAI,
  isRunning   = false,
  isSubmitting = false,
  isAskingAI  = false,
  disabled    = false,
}) {
  const [language,    setLanguage]    = useState('python');
  const [code,        setCode]        = useState(STARTERS['python']);
  const [showLangDD,  setShowLangDD]  = useState(false);
  const editorRef = useRef(null);

  const handleLangChange = (lang) => {
    setLanguage(lang);
    setCode(STARTERS[lang] || '');
    setShowLangDD(false);
  };

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
  };

  const currentLang = LANGUAGES.find(l => l.id === language);

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden border"
         style={{ borderColor: '#334155', backgroundColor: '#1e293b' }}>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b"
           style={{ borderColor: '#334155', backgroundColor: '#1e293b' }}>

        {/* Language selector */}
        <div className="relative">
          <button
            onClick={() => setShowLangDD(!showLangDD)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{ backgroundColor: '#0f172a', color: '#e2e8f0', border: '1px solid #334155' }}
          >
            {currentLang?.label}
            <ChevronDown size={14} style={{ color: '#64748b' }} />
          </button>

          {showLangDD && (
            <div className="absolute top-full left-0 mt-1 rounded-lg shadow-xl z-50 min-w-36 py-1 border"
                 style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
              {LANGUAGES.map(lang => (
                <button
                  key={lang.id}
                  onClick={() => handleLangChange(lang.id)}
                  className="w-full text-left px-4 py-2 text-sm transition-colors"
                  style={{
                    color:           language === lang.id ? '#818cf8' : '#94a3b8',
                    backgroundColor: language === lang.id ? '#1e1b4b' : 'transparent',
                  }}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {onAskAI && (
            <button
              onClick={() => onAskAI(code, language)}
              disabled={isRunning || isSubmitting || disabled}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 hover:opacity-80"
              style={{ backgroundColor: '#4c1d95', color: '#ddd6fe', border: '1px solid #5b21b6' }}
            >
              ✨ Ask AI
            </button>
          )}

          <button
            onClick={() => onRun && onRun(code, language)}
            disabled={isRunning || disabled}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
            style={{ backgroundColor: '#164e63', color: '#67e8f9', border: '1px solid #155e75' }}
          >
            {isRunning
              ? <Loader2 size={14} className="animate-spin" />
              : <Play size={14} />
            }
            Run
          </button>

          <button
            onClick={() => onSubmit && onSubmit(code, language)}
            disabled={isSubmitting || disabled}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
            style={{ backgroundColor: '#6366f1', color: 'white' }}
          >
            {isSubmitting
              ? <Loader2 size={14} className="animate-spin" />
              : <Send size={14} />
            }
            Submit
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0">
        <MonacoEditor
          height="100%"
          language={currentLang?.monacoId || 'python'}
          value={code}
          theme="vs-dark"
          onChange={(val) => setCode(val || '')}
          onMount={handleEditorMount}
          options={{
            fontSize:           14,
            fontFamily:         "'JetBrains Mono', 'Fira Code', monospace",
            fontLigatures:      true,
            minimap:            { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers:        'on',
            renderLineHighlight: 'all',
            tabSize:            4,
            wordWrap:           'on',
            padding:            { top: 16, bottom: 16 },
            smoothScrolling:    true,
            cursorBlinking:     'smooth',
            bracketPairColorization: { enabled: true },
          }}
        />
      </div>
    </div>
  );
}
