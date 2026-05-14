import { useState } from 'react'
import Editor from '@monaco-editor/react'
import { Play, Loader2, Copy, Check, Terminal } from 'lucide-react'
import api from '../api/client'

interface ExecuteResult {
  stdout: string
  stderr: string
  compile_output?: string
}

interface ExecuteResponse {
  execution: ExecuteResult
  rate_limit: { remaining: number; reset_in_seconds: number }
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
  const [editedCode, setEditedCode] = useState(initialCode)
  const [isEditing,  setIsEditing]  = useState(false)
  const [showStdin,  setShowStdin]  = useState(false)
  const [stdin,      setStdin]      = useState('')
  const [running,    setRunning]    = useState(false)
  const [result,     setResult]     = useState<ExecuteResult | null>(null)
  const [copied,     setCopied]     = useState(false)

  const monacoLang  = LANG_MAP[language.toLowerCase()] ?? language.toLowerCase()
  const displayLang = language || 'code'

  const handleRun = async () => {
    setRunning(true)
    setResult(null)
    try {
      const res = await api.post<ExecuteResponse>('/execute/', {
        language: monacoLang,
        code: editedCode,
        stdin: stdin.replace(/\r\n/g, '\n').replace(/\r/g, '\n'),
      })
      setResult(res.data.execution)
    } catch (err: unknown) {
      const resp = (err as { response?: { status?: number; data?: { detail?: string } } })?.response
      const detail = resp?.data?.detail
      if (resp?.status === 429) {
        setResult({ stdout: '', stderr: 'Limite d\'exécutions atteinte. Réessayez dans quelques minutes.' })
      } else if (resp?.status === 400 && detail) {
        setResult({ stdout: '', stderr: `Langage non supporté : ${detail}` })
      } else {
        setResult({ stdout: '', stderr: detail ?? 'Erreur : impossible de contacter le serveur d\'exécution.' })
      }
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
    <div className="my-3 rounded-xl overflow-hidden text-sm border border-white/[0.08] bg-[#1e1e1e]">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/[0.04] border-b border-white/[0.06]">
        <span className="text-xs font-mono text-white/40">{displayLang}</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-white/50 hover:text-white/80 hover:bg-white/5 transition-all"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copié' : 'Copier'}
          </button>
          <button
            type="button"
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
            type="button"
            title="Entrée standard (stdin)"
            onClick={() => setShowStdin(v => !v)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
              showStdin
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            <Terminal className="w-3 h-3" />
            stdin
          </button>
          <button
            type="button"
            onClick={handleRun}
            disabled={running}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border border-emerald-500/25 transition-all ${
              running
                ? 'bg-emerald-500/10 text-emerald-300/60 cursor-not-allowed'
                : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 cursor-pointer'
            }`}
          >
            {running
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <Play className="w-3 h-3 fill-current" />}
            Exécuter
          </button>
        </div>
      </div>

      {/* Code editor / display */}
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
        <pre className="m-0 overflow-x-auto text-xs leading-relaxed text-white/80 font-mono px-4 py-3 whitespace-pre bg-transparent">
          {editedCode}
        </pre>
      )}

      {/* Stdin input */}
      {showStdin && (
        <div className="border-t border-white/[0.06]">
          <p className="text-[10px] text-amber-300/60 px-4 pt-2 font-mono">
            Entrée standard (une ligne par input() / scanf)
          </p>
          <textarea
            value={stdin}
            onChange={e => setStdin(e.target.value)}
            rows={3}
            placeholder={"Ex :\n1\n10\n20"}
            spellCheck={false}
            className="w-full m-0 px-4 py-2 bg-amber-500/[0.03] text-xs font-mono text-amber-100/70 placeholder-white/20 border-none outline-none resize-none"
          />
        </div>
      )}

      {/* Output */}
      {result && (
        <div className="border-t border-white/[0.06]">
          {result.stdout && (
            <pre className="m-0 text-xs font-mono px-4 py-3 leading-relaxed text-emerald-300 bg-emerald-500/[0.04]">
              {result.stdout}
            </pre>
          )}
          {result.stderr && (
            <pre className="m-0 text-xs font-mono px-4 py-3 leading-relaxed text-red-300 bg-red-500/[0.04]">
              {result.stderr}
            </pre>
          )}
          {!result.stdout && !result.stderr && (
            <p className="text-xs text-white/30 px-4 py-3 font-mono italic">
              Exécution terminée (pas de sortie)
            </p>
          )}
        </div>
      )}
    </div>
  )
}
