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
import EquipmentCreate from './pages/EquipmentCreate'
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
            <Route path="/equipment/new" element={<EquipmentCreate />} />
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
