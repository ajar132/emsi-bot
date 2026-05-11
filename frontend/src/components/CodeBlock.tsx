import { useState } from 'react'
import Editor from '@monaco-editor/react'
import { Play, Loader2, Copy, Check } from 'lucide-react'
import api from '../api/client'

interface ExecuteResult {
  stdout: string
  stderr: string
  compile_output?: string
}

interface Props {
  language: string
  code: string
}

const LANG_MAP: Record<string, string> = {
  js: 'javascript', javascript: 'javascript',
  ts: 'typescript', typescript: 'typescript',
  py: 'python',     python: 'python',
  cpp: 'cpp',       c: 'c',
  java: 'java',     go: 'go',
  rust: 'rust',     sh: 'shell', bash: 'shell',
  html: 'html',     css: 'css',  json: 'json',
}

export default function CodeBlock({ language, code: initialCode }: Props) {
  const [editedCode, setEditedCode]   = useState(initialCode)
  const [isEditing,  setIsEditing]    = useState(false)
  const [running,    setRunning]      = useState(false)
  const [result,     setResult]       = useState<ExecuteResult | null>(null)
  const [copied,     setCopied]       = useState(false)

  const monacoLang = LANG_MAP[language.toLowerCase()] ?? language.toLowerCase()
  const displayLang = language || 'code'

  const handleRun = async () => {
    setRunning(true)
    setResult(null)
    try {
      const res = await api.post<ExecuteResult>('/execute/', {
        language: monacoLang,
        code: editedCode,
      })
      setResult(res.data)
    } catch {
      setResult({ stdout: '', stderr: 'Erreur : impossible de contacter le serveur d\'exécution.' })
    } finally {
      setRunning(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(editedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div
      className="my-3 rounded-xl overflow-hidden text-sm"
      style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#1e1e1e' }}
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <span className="text-xs font-mono text-white/40">{displayLang}</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-white/50 hover:text-white/80 hover:bg-white/5 transition-all"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copié' : 'Copier'}
          </button>
          <button
            onClick={() => setIsEditing(v => !v)}
            className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
              isEditing
                ? 'bg-violet-600/30 text-violet-300 border border-violet-500/30'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            {isEditing ? 'Lecture' : 'Éditer'}
          </button>
          <button
            onClick={handleRun}
            disabled={running}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: running ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.2)',
              color: running ? 'rgba(134,239,172,0.6)' : '#86efac',
              border: '1px solid rgba(34,197,94,0.25)',
              cursor: running ? 'not-allowed' : 'pointer',
            }}
          >
            {running
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <Play className="w-3 h-3 fill-current" />}
            Exécuter
          </button>
        </div>
      </div>

      {/* Monaco or pre */}
      {isEditing ? (
        <Editor
          height="240px"
          language={monacoLang}
          value={editedCode}
          onChange={v => setEditedCode(v ?? '')}
          theme="vs-dark"
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            renderLineHighlight: 'none',
            overviewRulerLanes: 0,
            padding: { top: 12, bottom: 12 },
            fontFamily: 'ui-monospace, Consolas, monospace',
          }}
        />
      ) : (
        <pre
          className="overflow-x-auto text-xs leading-relaxed text-white/80 font-mono px-4 py-3"
          style={{ margin: 0, whiteSpace: 'pre', background: 'transparent' }}
        >
          {editedCode}
        </pre>
      )}

      {/* Output */}
      {result && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {result.stdout && (
            <pre
              className="text-xs font-mono px-4 py-3 leading-relaxed"
              style={{ color: '#86efac', background: 'rgba(34,197,94,0.04)', margin: 0 }}
            >
              {result.stdout}
            </pre>
          )}
          {result.stderr && (
            <pre
              className="text-xs font-mono px-4 py-3 leading-relaxed"
              style={{ color: '#fca5a5', background: 'rgba(239,68,68,0.04)', margin: 0 }}
            >
              {result.stderr}
            </pre>
          )}
          {!result.stdout && !result.stderr && (
            <p className="text-xs text-white/30 px-4 py-3 font-mono italic">Exécution terminée (pas de sortie)</p>
          )}
        </div>
      )}
    </div>
  )
}
