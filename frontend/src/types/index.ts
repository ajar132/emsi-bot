export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: 'STUDENT' | 'ADMIN' | 'SUPER_ADMIN'
  date_joined: string
}

export interface Message {
  id: string
  role: 'USER' | 'ASSISTANT'
  content: string
  source: '' | 'LLM' | 'FAQ' | 'HYBRID'
  tokens_used: number
  created_at: string
}

export interface Conversation {
  id: string
  title: string
  is_favorite: boolean
  message_count?: number
  messages?: Message[]
  created_at: string
  updated_at: string
}

export interface FAQEntry {
  id: string
  question: string
  answer: string
  category: string
  hit_count: number
  created_by_email: string
  created_at: string
  updated_at: string
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface LoginResponse extends AuthTokens {
  user: User
}
