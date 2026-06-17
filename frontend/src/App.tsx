import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { Layout, Menu, Button, Drawer, Grid } from 'antd'
import {
  DashboardOutlined,
  ToolOutlined,
  EnvironmentOutlined,
  SwapOutlined,
  FileTextOutlined,
  ScanOutlined,
  LogoutOutlined,
  MenuOutlined
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

const { Header, Content } = Layout
const { useBreakpoint } = Grid

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
  const screens = useBreakpoint()
  const isMobile = !screens.md  // Ant Design md = 768px
  const [drawerOpen, setDrawerOpen] = useState(false)

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: 'Дашборд' },
    { key: '/equipment', icon: <ToolOutlined />, label: 'Оборудование' },
    { key: '/warehouses', icon: <EnvironmentOutlined />, label: 'Склады' },
    { key: '/movements', icon: <SwapOutlined />, label: 'Перемещения' },
    { key: '/scan', icon: <ScanOutlined />, label: 'Сканер' },
    ...(isAdmin ? [{ key: '/logs', icon: <FileTextOutlined />, label: 'Журнал' }] : []),
  ]

  const handleMenuClick = (key: string) => {
    navigate(key)
    if (isMobile) setDrawerOpen(false)
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {isMobile ? (
        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={250}
          bodyStyle={{ padding: 0 }}
        >
          <div style={{ color: '#fff', background: '#001529', textAlign: 'center', padding: '16px', fontWeight: 'bold' }}>
            WSS
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => handleMenuClick(key)}
          />
        </Drawer>
      ) : (
        <Layout.Sider collapsible breakpoint="md" style={{ minHeight: '100vh' }}>
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
        </Layout.Sider>
      )}

      <Layout>
        <Header style={{
          background: '#fff',
          padding: isMobile ? '0 16px' : '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isMobile && (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setDrawerOpen(true)}
              />
            )}
            <span style={{ fontSize: isMobile ? '16px' : '18px' }}>Складская система</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{user?.full_name || user?.username} ({user?.role?.name})</span>
            <Button type="text" icon={<LogoutOutlined />} onClick={logout} />
          </div>
        </Header>

        <Content style={{ margin: isMobile ? '8px' : '16px' }}>
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
