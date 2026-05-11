import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2, Command, Code2, BookOpen, FileText, PenLine, Menu } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import MessageBubble from '../components/MessageBubble'
import ThinkingDots from '../components/ThinkingDots'
import BotAvatar from '../components/BotAvatar'
import { chatApi } from '../api/chat'
import { useAuthStore } from '../store/authStore'
import { useAutoResize } from '../hooks/useAutoResize'
import type { Conversation, Message } from '../types'

const COMMANDS = [
  { Icon: Code2,    label: 'Code',     description: 'Générer du code',     prefix: 'Génère du code pour '  },
  { Icon: BookOpen, label: 'Explique', description: 'Expliquer un concept', prefix: 'Explique-moi '         },
  { Icon: FileText, label: 'Résume',   description: 'Résumer un cours',     prefix: 'Résume ce cours sur '  },
  { Icon: PenLine,  label: 'Exercice', description: 'Créer un exercice',    prefix: 'Crée un exercice sur ' },
]

export default function ChatPage() {
  const navigate = useNavigate()
  const logout   = useAuthStore(s => s.logout)

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId,      setActiveId]      = useState<string | null>(null)
  const [messages,      setMessages]      = useState<Message[]>([])
  const [loadingConv,   setLoadingConv]   = useState(false)
  const [inputValue,    setInputValue]    = useState('')
  const [sending,       setSending]       = useState(false)
  const [showMenu,      setShowMenu]      = useState(false)
  const [selCmd,        setSelCmd]        = useState(-1)
  const [isFocused,     setIsFocused]     = useState(false)
  const [mousePos,      setMousePos]      = useState({ x: 0, y: 0 })
  const [sidebarOpen,   setSidebarOpen]   = useState(false)

  const { textareaRef, adjustHeight } = useAutoResize({ minHeight: 60, maxHeight: 200 })
  const bottomRef = useRef<HTMLDivElement>(null)
  const menuRef   = useRef<HTMLDivElement>(null)

  /* ── data ── */
  useEffect(() => { chatApi.getConversations().then(setConversations).catch(() => {}) }, [])

  useEffect(() => {
    if (!activeId) return
    setLoadingConv(true)
    chatApi.getConversation(activeId)
      .then(c => setMessages(c.messages ?? []))
      .catch(() => {})
      .finally(() => setLoadingConv(false))
  }, [activeId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, sending])

  useEffect(() => {
    const h = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', h)
    return () => window.removeEventListener('mousemove', h)
  }, [])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (menuRef.current && !menuRef.current.contains(t) && t.dataset.cmdBtn !== 'true')
        setShowMenu(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  /* ── handlers ── */
  const selectCommand = (i: number) => {
    setInputValue(COMMANDS[i].prefix)
    setShowMenu(false); setSelCmd(-1)
    setTimeout(() => { textareaRef.current?.focus(); adjustHeight() }, 0)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMenu) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelCmd(n => Math.min(n + 1, COMMANDS.length - 1)); return }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelCmd(n => Math.max(n - 1, 0)); return }
      if ((e.key === 'Enter' || e.key === 'Tab') && selCmd >= 0) { e.preventDefault(); selectCommand(selCmd); return }
      if (e.key === 'Escape') { setShowMenu(false); return }
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value
    setInputValue(v); adjustHeight()
    if (v === '/') { setShowMenu(true); setSelCmd(0) }
    else if (!v.startsWith('/')) setShowMenu(false)
  }

  const handleNew = async () => {
    const conv = await chatApi.createConversation()
    setConversations(p => [conv, ...p]); setActiveId(conv.id); setMessages([])
  }

  const handleDelete = async (id: string) => {
    await chatApi.deleteConversation(id)
    setConversations(p => p.filter(c => c.id !== id))
    if (activeId === id) { setActiveId(null); setMessages([]) }
  }

  const handleLogout = () => { logout(); navigate('/login') }

  const handleSend = async () => {
    const content = inputValue.trim()
    if (!content || sending) return
    setInputValue(''); adjustHeight(true); setSending(true)

    const optimistic: Message = {
      id: `tmp-${Date.now()}`, role: 'USER', content,
      source: '', tokens_used: 0, created_at: new Date().toISOString(),
    }
    setMessages(p => [...p, optimistic])

    try {
      const res = await chatApi.sendMessage(content, activeId ?? undefined)
      if (!activeId) { setActiveId(res.conversation_id); chatApi.getConversations().then(setConversations).catch(() => {}) }
      setMessages(p => [...p.filter(m => m.id !== optimistic.id), res.user_message, res.assistant_message])
    } catch {
      setMessages(p => p.filter(m => m.id !== optimistic.id))
    } finally { setSending(false) }
  }

  const hasMessages = messages.length > 0 || sending

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0A0B]">
      <Sidebar
        conversations={conversations} activeId={activeId}
        isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}
        onSelect={setActiveId} onNew={handleNew} onDelete={handleDelete} onLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden text-white">

        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] relative z-10 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <BotAvatar size={18} className="text-violet-300" />
            <span className="text-white/80 text-sm font-medium">EMSI Bot</span>
          </div>
        </div>

        {/* Background orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-[128px] animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px] animate-pulse [animation-delay:700ms]" />
          <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-[96px] animate-pulse [animation-delay:1000ms]" />
        </div>

        {/* Empty state */}
        {!hasMessages && !loadingConv && (
          <div className="flex-1 flex items-center justify-center relative z-10">
            <motion.div
              className="w-full max-w-2xl px-6 text-center space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <motion.div
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/30 mb-2"
                initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                <BotAvatar size={32} className="text-violet-300" />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
                <h1 className="text-3xl font-medium tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white/90 to-white/40 pb-1">
                  Comment puis-je vous aider ?
                </h1>
                <motion.div
                  className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                />
              </motion.div>
              <motion.p
                className="text-sm text-white/40"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
              >
                Tapez votre question ou utilisez{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/60 text-xs font-mono">/</kbd>{' '}
                pour les commandes rapides
              </motion.p>
            </motion.div>
          </div>
        )}

        {/* Messages */}
        {(hasMessages || loadingConv) && (
          <div className="flex-1 overflow-y-auto relative z-10 py-6">
            {loadingConv ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
              </div>
            ) : (
              messages.map(m => <MessageBubble key={m.id} message={m} />)
            )}

            {sending && (
              <div className="flex justify-start mb-4 px-6">
                <div className="w-8 h-8 rounded-full bg-violet-600/80 flex items-center justify-center mr-2 mt-0.5 shrink-0">
                  <BotAvatar size={18} className="text-white" />
                </div>
                <div className="bg-white/[0.05] border border-white/[0.08] backdrop-blur-sm rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <span>En train de réfléchir</span>
                    <ThinkingDots />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Input zone */}
        <div className="relative z-10 p-4 md:p-6 shrink-0">
          <div className="w-full max-w-2xl mx-auto">

            <motion.div
              className="relative backdrop-blur-2xl bg-white/[0.02] rounded-2xl border border-white/[0.05] shadow-2xl"
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              {/* Command palette */}
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    ref={menuRef}
                    className="absolute left-4 right-4 bottom-full mb-2 backdrop-blur-xl bg-black/90 rounded-xl z-50 shadow-xl border border-white/10 overflow-hidden"
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.15 }}
                  >
                    {COMMANDS.map(({ Icon, label, description, prefix }, i) => (
                      <motion.button
                        key={prefix}
                        type="button"
                        onClick={() => selectCommand(i)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs text-left transition-colors ${
                          selCmd === i ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5'
                        }`}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <Icon className="w-4 h-4 shrink-0 text-white/50" />
                        <span className="font-medium">{label}</span>
                        <span className="text-white/35">{description}</span>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Textarea */}
              <div className="p-4">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Posez votre question… (/ pour les commandes, Entrée pour envoyer)"
                  maxLength={2000}
                  className="w-full px-4 py-3 resize-none bg-transparent border-none outline-none text-white/90 text-sm placeholder:text-white/20 min-h-[60px]"
                  style={{ overflow: 'hidden' }}
                />
              </div>

              {/* Toolbar */}
              <div className="px-4 pb-4 flex items-center justify-between gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-2">
                  <motion.button
                    type="button"
                    data-cmd-btn="true"
                    onClick={() => { setShowMenu(v => !v); setSelCmd(0) }}
                    whileTap={{ scale: 0.94 }}
                    className={`p-2 rounded-lg transition-colors ${showMenu ? 'bg-white/10 text-white/90' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}
                    title="Commandes rapides (/)"
                  >
                    <Command className="w-4 h-4 pointer-events-none" />
                  </motion.button>
                  <span className="text-[10px] text-white/20 select-none">{inputValue.length}/2000</span>
                </div>

                <motion.button
                  type="button"
                  onClick={handleSend}
                  disabled={sending || !inputValue.trim()}
                  whileHover={{ scale: inputValue.trim() && !sending ? 1.01 : 1 }}
                  whileTap={{ scale: 0.97 }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    inputValue.trim() && !sending
                      ? 'bg-white text-[#0A0A0B] shadow-lg shadow-white/10'
                      : 'bg-white/[0.05] text-white/40 cursor-not-allowed'
                  }`}
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Envoyer</span>
                </motion.button>
              </div>
            </motion.div>

            {/* Quick command chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              {COMMANDS.map(({ Icon, label, prefix }, i) => (
                <motion.button
                  key={prefix}
                  type="button"
                  onClick={() => selectCommand(i)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] rounded-lg text-xs text-white/50 hover:text-white/80 transition-all"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Floating thinking pill */}
        <AnimatePresence>
          {sending && (
            <motion.div
              className="absolute bottom-36 left-1/2 -translate-x-1/2 backdrop-blur-2xl bg-white/[0.04] rounded-full px-4 py-2 border border-white/[0.08] shadow-xl z-20 pointer-events-none"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-violet-600/70 flex items-center justify-center">
                  <BotAvatar size={14} className="text-white" />
                </div>
                <div className="flex items-center gap-1.5 text-sm text-white/60">
                  <span>EMSI Bot réfléchit</span>
                  <ThinkingDots />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mouse-follow glow */}
        {isFocused && (
          <motion.div
            className="fixed w-[50rem] h-[50rem] rounded-full pointer-events-none z-0 opacity-[0.025] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 blur-[96px]"
            animate={{ x: mousePos.x - 400, y: mousePos.y - 400 }}
            transition={{ type: 'spring', damping: 25, stiffness: 150, mass: 0.5 }}
          />
        )}
      </main>
    </div>
  )
}
