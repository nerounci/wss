import React, { createContext, useState, useEffect, useContext } from 'react'
import { api } from '../api/client'

interface User {
  id: number
  username: string
  full_name: string | null
  role: { name: string }
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isAdmin: boolean
  isOwner: boolean
  permissions: Record<string, boolean>
  permissionsLoaded: boolean
  canView: (pageKey: string) => boolean
}

const AuthContext = createContext<AuthContextType>(undefined!)

export const useAuth = () => useContext(AuthContext)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})
  const [permissionsLoaded, setPermissionsLoaded] = useState(false)

  // Загрузка пользователя при монтировании
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          const res = await api.get('/api/users/me')
          setUser(res.data)
          const permRes = await api.get('/api/users/me/permissions')
          setPermissions(permRes.data)
          setPermissionsLoaded(true)
        } catch (error) {
          localStorage.removeItem('token')
          setToken(null)
          setUser(null)
          setPermissions({})
          setPermissionsLoaded(false)
          delete api.defaults.headers.common['Authorization']
        }
      }
    }
    loadUser()
  }, [token])


  const login = async (username: string, password: string) => {
    // 1. Отправляем запрос на получение токена
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)

    const res = await api.post('/api/token', formData)
    const { access_token } = res.data

    // 2. Сохраняем токен
    localStorage.setItem('token', access_token)
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`

    // 3. Устанавливаем токен в состояние (триггерит useEffect)
    setToken(access_token)

    // 4. ЖДЕМ загрузки пользователя
    const userRes = await api.get('/api/users/me')
    setUser(userRes.data)
    const permRes = await api.get('/api/users/me/permissions')
    setPermissions(permRes.data)
    setPermissionsLoaded(true)

  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    setPermissions({})
    setPermissionsLoaded(false)
    delete api.defaults.headers.common['Authorization']
  }

  const isOwner = user?.role?.name === 'owner'
  const isAdmin = isOwner || user?.role?.name === 'admin'
  const canView = (pageKey: string) => permissions[pageKey] ?? false

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAdmin, isOwner, permissions, permissionsLoaded, canView }}>
      {children}
    </AuthContext.Provider>
  )
}
