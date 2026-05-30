#!/bin/bash
set -e

# Исправляем tsconfig
cat > frontend/tsconfig.json <<EOF
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["src"]
}
EOF

rm -f frontend/tsconfig.node.json

# Правильный package.json (без tsc)
cat > frontend/package.json <<EOF
{
  "name": "wss-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "antd": "^5.15.0",
    "@ant-design/icons": "^5.3.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "axios": "^1.6.7",
    "html5-qrcode": "^2.3.8",
    "dayjs": "^1.11.10"
  },
  "devDependencies": {
    "@types/react": "^18.2.55",
    "@types/react-dom": "^18.2.19",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.1.0"
  }
}
EOF

# Приводим имена файлов к правильному регистру
cd frontend/src
mv app.tsx App.tsx 2>/dev/null || true
mv authContext.tsx AuthContext.tsx 2>/dev/null || true
mv login.tsx Login.tsx 2>/dev/null || true
mv dashboard.tsx Dashboard.tsx 2>/dev/null || true
mv equipmentList.tsx EquipmentList.tsx 2>/dev/null || true
mv equipmentDetail.tsx EquipmentDetail.tsx 2>/dev/null || true
mv warehouseList.tsx WarehouseList.tsx 2>/dev/null || true
mv warehouseDetail.tsx WarehouseDetail.tsx 2>/dev/null || true
mv movements.tsx Movements.tsx 2>/dev/null || true
mv scan.tsx Scan.tsx 2>/dev/null || true
mv logs.tsx Logs.tsx 2>/dev/null || true
rm -f Logix.tsx
cd ../..

# Готовый AuthContext.tsx (экспортирует useAuth и AuthProvider)
cat > frontend/src/context/AuthContext.tsx <<EOF
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
}

const AuthContext = createContext<AuthContextType>(undefined!)

export const useAuth = () => useContext(AuthContext)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = \`Bearer \${token}\`
      api.get('/api/users/me')
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('token')
          setToken(null)
          setUser(null)
        })
    }
  }, [token])

  const login = async (username: string, password: string) => {
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)
    const res = await api.post('/api/token', formData)
    const { access_token } = res.data
    localStorage.setItem('token', access_token)
    setToken(access_token)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    delete api.defaults.headers.common['Authorization']
  }

  const isAdmin = user?.role?.name === 'admin'

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}
EOF

# Правильный App.tsx
cat > frontend/src/App.tsx <<EOF
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { Layout, Menu, Button } from 'antd'
import {
  DashboardOutlined,
  ToolOutlined,
  EnvironmentOutlined,
  SwapOutlined,
  FileTextOutlined,
  ScanOutlined,
  LogoutOutlined
} from '@ant-design/icons'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import EquipmentList from './pages/EquipmentList'
import EquipmentDetail from './pages/EquipmentDetail'
import WarehouseList from './pages/WarehouseList'
import WarehouseDetail from './pages/WarehouseDetail'
import Movements from './pages/Movements'
import Logs from './pages/Logs'
import Scan from './pages/Scan'
import { useNavigate, useLocation } from 'react-router-dom'

const { Header, Sider, Content } = Layout

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin } = useAuth()
  if (!isAdmin) return <Navigate to="/" replace />
  return <>{children}</>
}

const AppLayout: React.FC = () => {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: 'Дашборд' },
    { key: '/equipment', icon: <ToolOutlined />, label: 'Оборудование' },
    { key: '/warehouses', icon: <EnvironmentOutlined />, label: 'Склады' },
    { key: '/movements', icon: <SwapOutlined />, label: 'Перемещения' },
    { key: '/scan', icon: <ScanOutlined />, label: 'Сканер' },
    ...(isAdmin ? [{ key: '/logs', icon: <FileTextOutlined />, label: 'Журнал' }] : []),
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible>
        <div style={{ color: 'white', textAlign: 'center', padding: '16px', fontWeight: 'bold' }}>
          WSS
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '18px' }}>Складская система</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span>{user?.full_name || user?.username} ({user?.role?.name})</span>
            <Button type="text" icon={<LogoutOutlined />} onClick={logout} />
          </div>
        </Header>
        <Content style={{ margin: '16px' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/equipment" element={<EquipmentList />} />
            <Route path="/equipment/:id" element={<EquipmentDetail />} />
            <Route path="/warehouses" element={<WarehouseList />} />
            <Route path="/warehouses/:id" element={<WarehouseDetail />} />
            <Route path="/movements" element={<Movements />} />
            <Route path="/scan" element={<Scan />} />
            <Route path="/logs" element={<AdminRoute><Logs /></AdminRoute>} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      } />
    </Routes>
  )
}

export default App
EOF

echo "Fix completed. Run: docker compose up --build"
