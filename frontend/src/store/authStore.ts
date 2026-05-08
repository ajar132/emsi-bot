import { create } from 'zustand'
import type { User } from '../types'

interface AuthState {
  access: string | null
  refresh: string | null
  user: User | null
  isAuthenticated: boolean
  setTokens: (access: string, refresh: string, user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  access: localStorage.getItem('access'),
  refresh: localStorage.getItem('refresh'),
  user: null,
  isAuthenticated: !!localStorage.getItem('access'),

  setTokens: (access, refresh, user) => {
    localStorage.setItem('access', access)
    localStorage.setItem('refresh', refresh)
    set({ access, refresh, user, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    set({ access: null, refresh: null, user: null, isAuthenticated: false })
  },
}))
