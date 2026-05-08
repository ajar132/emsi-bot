import BotAvatar from './BotAvatar'
import type { Message } from '../types'

const SOURCE_BADGE: Record<string, { label: string; cls: string }> = {
  FAQ:    { label: 'FAQ',    cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  LLM:    { label: 'Gemini', cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  HYBRID: { label: 'Hybrid', cls: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
}

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'USER'
  const badge  = SOURCE_BADGE[message.source]

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 px-6`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-violet-600/80 flex items-center justify-center mr-2 mt-0.5 shrink-0 shadow-md shadow-violet-500/20">
          <BotAvatar size={18} className="text-white" />
        </div>
      )}

      <div className={`max-w-[75%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-white text-[#0A0A0B] font-medium rounded-tr-sm'
              : 'bg-white/[0.05] text-white/90 border border-white/[0.08] backdrop-blur-sm rounded-tl-sm'
          }`}
        >
          {message.content}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-white/30">
            {new Date(message.created_at).toLocaleTimeString('fr-FR', {
              hour: '2-digit', minute: '2-digit',
            })}
          </span>
          {badge && (
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${badge.cls}`}>
              {badge.label}
            </span>
          )}
          {message.tokens_used > 0 && (
            <span className="text-[10px] text-white/20">{message.tokens_used} tok</span>
          )}
        </div>
      </div>
    </div>
  )
}
