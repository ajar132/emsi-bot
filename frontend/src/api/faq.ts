import api from './client'
import type { FAQEntry } from '../types'

export const faqApi = {
  list: (params?: { search?: string; ordering?: string }) =>
    api.get<FAQEntry[]>('/faq/', { params }).then(r => r.data),

  get: (id: string) =>
    api.get<FAQEntry>(`/faq/${id}/`).then(r => r.data),

  create: (data: Pick<FAQEntry, 'question' | 'answer' | 'category'>) =>
    api.post<FAQEntry>('/faq/', data).then(r => r.data),

  update: (id: string, data: Partial<Pick<FAQEntry, 'question' | 'answer' | 'category'>>) =>
    api.patch<FAQEntry>(`/faq/${id}/`, data).then(r => r.data),

  remove: (id: string) =>
    api.delete(`/faq/${id}/`),
}
