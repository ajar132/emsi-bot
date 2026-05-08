import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import AuroraBackground from '../components/AuroraBackground'
import BotAvatar from '../components/BotAvatar'
import { authApi } from '../api/auth'
import { useAuthStore } from '../store/authStore'

/* ── Premium Input ── */
function PremiumInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      {...props}
      onFocus={e => { setFocused(true); props.onFocus?.(e) }}
      onBlur={e => { setFocused(false); props.onBlur?.(e) }}
      className="font-body w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-all duration-200"
      style={{
        background: focused ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${focused ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.1)'}`,
        boxShadow: focused ? '0 0 0 3px rgba(139,92,246,0.12)' : 'none',
      }}
    />
  )
}

type Mode = 'login' | 'register'

export default function AuthPage() {
  const navigate  = useNavigate()
  const setTokens = useAuthStore(s => s.setTokens)
  const [mode,    setMode]    = useState<Mode>('login')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const [form, setForm] = useState({
    email: '', password: '', password_confirm: '', first_name: '', last_name: '',
  })
  const update = (f: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [f]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'login') {
        const data = await authApi.login(form.email, form.password)
        setTokens(data.access, data.refresh, data.user)
        navigate('/chat')
      } else {
        await authApi.register(form)
        const data = await authApi.login(form.email, form.password)
        setTokens(data.access, data.refresh, data.user)
        navigate('/chat')
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: Record<string, unknown> } }
      const d = axiosErr.response?.data
      setError(d ? Object.values(d).flat().join(' ') || 'Erreur inconnue.' : 'Serveur inaccessible.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#08060d] flex items-center justify-center relative overflow-hidden">
      <AuroraBackground />
      <div className="absolute inset-0 bg-black/25 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-4 py-10">

        {/* ── Hero title ── */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1
            className="font-display font-extrabold leading-[1.05] tracking-tight"
            style={{
              fontSize: 'clamp(2.8rem, 8vw, 4.4rem)',
              background: 'linear-gradient(135deg, #ffffff 0%, #e0d4ff 35%, #a78bfa 65%, #7c3aed 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            WELCOME<br />EMSI ENGINEERS
          </h1>

          <motion.div
            className="h-px mx-auto mt-4 mb-4"
            style={{
              background: 'linear-gradient(to right, transparent, rgba(139,92,246,0.5), transparent)',
              maxWidth: 280,
            }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          />

          <motion.p
            className="font-body text-white/45 text-sm tracking-wide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
          >
            Votre assistant pédagogique intelligent
          </motion.p>
        </motion.div>

        {/* ── Auth card ── */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Subtle violet outer glow */}
          <div
            className="absolute -inset-px rounded-2xl pointer-events-none"
            style={{ boxShadow: '0 0 40px rgba(124,58,237,0.18), 0 0 1px rgba(139,92,246,0.3)' }}
          />

          <div
            className="relative bg-white/[0.04] backdrop-blur-2xl rounded-2xl p-8 shadow-2xl"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
          >
            {/* Brand inside card */}
            <div className="flex items-center gap-3 mb-7">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: 'rgba(124,58,237,0.25)',
                  border: '1px solid rgba(139,92,246,0.4)',
                  boxShadow: '0 0 16px rgba(124,58,237,0.2)',
                }}
              >
                <BotAvatar size={22} className="text-violet-300" />
              </div>
              <div>
                <p className="font-display font-bold text-white text-base leading-none">EMSI Bot</p>
                <p className="font-body text-white/40 text-xs mt-0.5">
                  {mode === 'login' ? 'Connectez-vous pour continuer' : 'Créez votre compte'}
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div
              className="flex p-1 rounded-xl mb-6"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {(['login', 'register'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(null) }}
                  className="font-body flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                  style={
                    mode === m
                      ? {
                          background: 'rgba(124,58,237,0.35)',
                          color: '#e2d9ff',
                          boxShadow: '0 0 16px rgba(124,58,237,0.25)',
                          border: '1px solid rgba(139,92,246,0.35)',
                        }
                      : { color: 'rgba(255,255,255,0.38)', border: '1px solid transparent' }
                  }
                >
                  {m === 'login' ? 'Connexion' : 'Inscription'}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <AnimatePresence mode="wait">
                {mode === 'register' && (
                  <motion.div
                    key="names"
                    className="grid grid-cols-2 gap-3"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <PremiumInput type="text" placeholder="Prénom" value={form.first_name} onChange={update('first_name')} required />
                    <PremiumInput type="text" placeholder="Nom"    value={form.last_name}  onChange={update('last_name')}  required />
                  </motion.div>
                )}
              </AnimatePresence>

              <PremiumInput type="email"    placeholder="Adresse e-mail"    value={form.email}    onChange={update('email')}    required />
              <PremiumInput type="password" placeholder="Mot de passe"      value={form.password} onChange={update('password')} required />

              <AnimatePresence mode="wait">
                {mode === 'register' && (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <PremiumInput type="password" placeholder="Confirmer le mot de passe" value={form.password_confirm} onChange={update('password_confirm')} required />
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {error && (
                  <motion.p
                    className="font-body text-xs text-red-300 px-3 py-2.5 rounded-xl"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.015 }}
                whileTap={{ scale: loading ? 1 : 0.985 }}
                className="font-body w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 mt-1"
                style={{
                  background: loading
                    ? 'rgba(124,58,237,0.3)'
                    : 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%)',
                  color: loading ? 'rgba(255,255,255,0.45)' : '#ffffff',
                  boxShadow: loading ? 'none' : '0 4px 24px rgba(124,58,237,0.4), 0 1px 0 rgba(255,255,255,0.1) inset',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  border: '1px solid rgba(139,92,246,0.3)',
                }}
              >
                {loading
                  ? 'Chargement…'
                  : mode === 'login'
                  ? 'Se connecter'
                  : "Créer mon compte"}
              </motion.button>
            </form>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
