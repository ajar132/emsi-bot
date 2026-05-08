import api from './client'
import type { Conversation } from '../types'

interface SendMessageResponse {
  conversation_id: string
  user_message: import('../types').Message
  assistant_message: import('../types').Message
}

export const chatApi = {
  getConversations: () =>
    api.get<Conversation[]>('/conversations/').then(r => r.data),

  getConversation: (id: string) =>
    api.get<Conversation>(`/conversations/${id}/`).then(r => r.data),

  createConversation: (title = 'Nouvelle conversation') =>
    api.post<Conversation>('/conversations/', { title }).then(r => r.data),

  updateConversation: (id: string, data: Partial<Pick<Conversation, 'title' | 'is_favorite'>>) =>
    api.patch<Conversation>(`/conversations/${id}/`, data).then(r => r.data),

  deleteConversation: (id: string) =>
    api.delete(`/conversations/${id}/`),

  sendMessage: (content: string, conversation_id?: string) =>
    api
      .post<SendMessageResponse>('/chat/', { content, ...(conversation_id && { conversation_id }) })
      .then(r => r.data),
}
