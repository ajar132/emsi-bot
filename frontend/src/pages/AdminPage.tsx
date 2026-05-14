import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, Search, X, LogOut, ChevronLeft, MessageCircle } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { faqApi } from '../api/faq'
import type { FAQEntry } from '../types'

interface FormState {
  question: string
  answer: string
  category: string
}

const EMPTY_FORM: FormState = { question: '', answer: '', category: '' }

export default function AdminPage() {
  const navigate  = useNavigate()
  const user   = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)

  const [entries,    setEntries]    = useState<FAQEntry[]>([])
  const [total,      setTotal]      = useState(0)
  const [search,     setSearch]     = useState('')
  const [loading,    setLoading]    = useState(false)
  const [editTarget, setEditTarget] = useState<FAQEntry | null>(null)
  const [showForm,   setShowForm]   = useState(false)
  const [form,       setForm]       = useState<FormState>(EMPTY_FORM)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')
  const [deleteId,   setDeleteId]   = useState<string | null>(null)

  const load = (q = search) => {
    setLoading(true)
    faqApi.list({ search: q || undefined, ordering: '-updated_at' })
      .then(data => { setEntries(data); setTotal(data.length) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const t = setTimeout(() => load(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const openCreate = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowForm(true)
  }

  const openEdit = (faq: FAQEntry) => {
    setEditTarget(faq)
    setForm({ question: faq.question, answer: faq.answer, category: faq.category })
    setError('')
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setEditTarget(null) }

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      setError('La question et la réponse sont obligatoires.')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (editTarget) {
        const updated = await faqApi.update(editTarget.id, form)
        setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
      } else {
        const created = await faqApi.create(form)
        setEntries(prev => [created, ...prev])
        setTotal(t => t + 1)
      }
      closeForm()
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 403) setError('Accès refusé — rôle ADMIN requis.')
      else if (status === 401) setError('Session expirée, reconnectez-vous.')
      else setError('Erreur lors de la sauvegarde (vérifiez que le backend est démarré).')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await faqApi.remove(id)
      setEntries(prev => prev.filter(e => e.id !== id))
      setTotal(t => t - 1)
    } catch {}
    setDeleteId(null)
  }

  const handleLogout = () => { logout(); navigate('/login', { replace: true }) }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/chat')}
            className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-sm"
          >
            <ChevronLeft size={16} />
            Chat
          </button>
          <span className="text-white/20">|</span>
          <h1 className="text-lg font-semibold">Panneau admin — FAQ</h1>
          <span className="ml-2 text-xs bg-violet-600/30 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full">
            {total} entrée{total !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/40">{user?.email}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-white/50 hover:text-red-400 transition-colors text-sm"
          >
            <LogOut size={15} />
            Déconnexion
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher une question…"
              className="w-full pl-9 pr-4 py-2 bg-white/[0.06] border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/60 transition-colors"
            />
            {search && (
              <button
                type="button"
                aria-label="Effacer la recherche"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={15} />
            Nouvelle FAQ
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-16 text-white/30 text-sm">Chargement…</div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-white/30 gap-3">
            <MessageCircle size={36} className="opacity-40" />
            <p>{search ? 'Aucun résultat.' : 'Aucune entrée FAQ. Créez la première !'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map(faq => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="group bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 hover:border-white/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-white leading-snug">{faq.question}</p>
                    <p className="mt-1 text-white/40 text-xs line-clamp-2">{faq.answer}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-white/25">
                      {faq.category && (
                        <span className="bg-white/[0.06] px-2 py-0.5 rounded">{faq.category}</span>
                      )}
                      <span>{faq.hit_count} hit{faq.hit_count !== 1 ? 's' : ''}</span>
                      <span>{new Date(faq.updated_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      aria-label="Modifier cette entrée FAQ"
                      onClick={() => openEdit(faq)}
                      className="p-1.5 text-white/40 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      aria-label="Supprimer cette entrée FAQ"
                      onClick={() => setDeleteId(faq.id)}
                      className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Create / Edit modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) closeForm() }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.25 }}
              className="w-full max-w-xl bg-[#111116] border border-white/10 rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold">{editTarget ? 'Modifier la FAQ' : 'Nouvelle entrée FAQ'}</h2>
                <button
                  type="button"
                  aria-label="Fermer"
                  onClick={closeForm}
                  className="text-white/30 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-white/50 mb-1">Question *</label>
                  <input
                    value={form.question}
                    onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                    placeholder="Ex : Quels sont les prérequis pour S3 ?"
                    className="w-full px-3 py-2 bg-white/[0.06] border border-white/10 rounded-lg text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/60 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Réponse * (markdown supporté)</label>
                  <textarea
                    value={form.answer}
                    onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}
                    rows={5}
                    placeholder="Réponse détaillée…"
                    className="w-full px-3 py-2 bg-white/[0.06] border border-white/10 rounded-lg text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/60 transition-colors resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Catégorie</label>
                  <input
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    placeholder="Ex : Inscriptions, Scolarité…"
                    className="w-full px-3 py-2 bg-white/[0.06] border border-white/10 rounded-lg text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/60 transition-colors"
                  />
                </div>
                {error && <p className="text-red-400 text-xs">{error}</p>}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 text-sm text-white/50 hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {saving && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  {editTarget ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-[#111116] border border-white/10 rounded-2xl p-6 shadow-2xl"
            >
              <h2 className="font-semibold mb-2">Confirmer la suppression</h2>
              <p className="text-sm text-white/50 mb-6">Cette entrée FAQ sera définitivement supprimée.</p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteId(null)}
                  className="px-4 py-2 text-sm text-white/50 hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(deleteId)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
