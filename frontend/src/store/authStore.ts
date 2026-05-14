import { create } from 'zustand'
import type { User } from '../types'

function loadUser(): User | null {
  try { return JSON.parse(localStorage.getItem('user') ?? 'null') }
  catch { return null }
}

interface AuthState {
  access: string | null
  refresh: string | null
  user: User | null
  isAuthenticated: boolean
  setTokens: (access: string, refresh: string, user: User) => void
  setUser: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  access: localStorage.getItem('access'),
  refresh: localStorage.getItem('refresh'),
  user: loadUser(),
  isAuthenticated: !!localStorage.getItem('access'),

  setTokens: (access, refresh, user) => {
    localStorage.setItem('access', access)
    localStorage.setItem('refresh', refresh)
    localStorage.setItem('user', JSON.stringify(user))
    set({ access, refresh, user, isAuthenticated: true })
  },

  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user))
    set({ user })
  },

  logout: () => {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    localStorage.removeItem('user')
    set({ access: null, refresh: null, user: null, isAuthenticated: false })
  },
}))
