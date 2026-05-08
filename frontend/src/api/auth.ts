import api from './client'
import type { LoginResponse, User } from '../types'

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login/', { email, password }).then(r => r.data),

  register: (data: {
    email: string
    password: string
    password_confirm: string
    first_name: string
    last_name: string
  }) => api.post<User>('/auth/register/', data).then(r => r.data),

  me: () => api.get<User>('/auth/me/').then(r => r.data),

  updateMe: (data: Partial<Pick<User, 'first_name' | 'last_name'>>) =>
    api.patch<User>('/auth/me/', data).then(r => r.data),
}
