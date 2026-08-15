import { useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { Layout, Menu, Button, Drawer, Grid, Spin } from 'antd'
import {
  DashboardOutlined,
  ToolOutlined,
  DesktopOutlined,
  EnvironmentOutlined,
  SwapOutlined,
  RetweetOutlined,
  UploadOutlined,
  FileTextOutlined,
  ScanOutlined,
  LogoutOutlined,
  MenuOutlined,
  TeamOutlined,
  SettingOutlined
} from '@ant-design/icons'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import EquipmentList from './pages/EquipmentList'
import EquipmentCreate from './pages/EquipmentCreate'
import EquipmentDetail from './pages/EquipmentDetail'
import Technology from './pages/Technology'
import WarehouseList from './pages/WarehouseList'
import WarehouseDetail from './pages/WarehouseDetail'
import Movements from './pages/Movements'
import BatchRelocation from './pages/BatchRelocation'
import Logs from './pages/Logs'
import Users from './pages/Users'
import ImportXlsx from './pages/ImportXlsx'
import Scan from './pages/Scan'

const { Header, Content } = Layout
const { useBreakpoint } = Grid

const MENU_CONFIG = [
  { key: '/', page: 'dashboard', icon: <DashboardOutlined />, label: 'Дашборд' },
  { key: '/equipment', page: 'equipment', icon: <ToolOutlined />, label: 'Оборудование' },
  { key: '/technology', page: 'technology', icon: <DesktopOutlined />, label: 'Техника' },
  { key: '/warehouses', page: 'warehouses', icon: <EnvironmentOutlined />, label: 'Склады и аудитории' },
  { key: '/movements', page: 'movements', icon: <SwapOutlined />, label: 'Перемещения' },
  { key: '/relocation', page: 'relocation', icon: <RetweetOutlined />, label: 'Перестановка' },
  { key: '/scan', page: 'scan', icon: <ScanOutlined />, label: 'Сканер' },
  { key: '/import', page: 'import', icon: <UploadOutlined />, label: 'Импорт Excel' },
]

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, permissionsLoaded } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!permissionsLoaded) return <div style={{ textAlign: 'center', marginTop: 100 }}><Spin size="large" /></div>
  return <>{children}</>
}

const PageRoute: React.FC<{ page: string; children: React.ReactNode }> = ({ page, children }) => {
  const { canView } = useAuth()
  if (!canView(page)) return <Navigate to="/" replace />
  return <>{children}</>
}

const AppLayout: React.FC = () => {
  const { user, logout, canView } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const screens = useBreakpoint()
  const isMobile = !screens.md  // Ant Design md = 768px
  const [drawerOpen, setDrawerOpen] = useState(false)

  const visibleItems = MENU_CONFIG.filter(item => canView(item.page)).map(({ key, icon, label }) => ({ key, icon, label }))
  const adminGroupChildren = [
    ...(canView('logs') ? [{ key: '/logs', icon: <FileTextOutlined />, label: 'Журнал' }] : []),
    ...(canView('users') ? [{ key: '/users', icon: <TeamOutlined />, label: 'Пользователи' }] : []),
  ]
  const menuItems = [
    ...visibleItems,
    ...(adminGroupChildren.length ? [{ key: 'admin-group', icon: <SettingOutlined />, label: 'Admin', children: adminGroupChildren }] : []),
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
            <Route path="/equipment" element={<PageRoute page="equipment"><EquipmentList /></PageRoute>} />
            <Route path="/equipment/new" element={<PageRoute page="equipment"><EquipmentCreate /></PageRoute>} />
            <Route path="/equipment/:id" element={<PageRoute page="equipment"><EquipmentDetail /></PageRoute>} />
            <Route path="/technology" element={<PageRoute page="technology"><Technology /></PageRoute>} />
            <Route path="/warehouses" element={<PageRoute page="warehouses"><WarehouseList /></PageRoute>} />
            <Route path="/warehouses/:id" element={<PageRoute page="warehouses"><WarehouseDetail /></PageRoute>} />
            <Route path="/movements" element={<PageRoute page="movements"><Movements /></PageRoute>} />
            <Route path="/relocation" element={<PageRoute page="relocation"><BatchRelocation /></PageRoute>} />
            <Route path="/scan" element={<PageRoute page="scan"><Scan /></PageRoute>} />
            <Route path="/import" element={<PageRoute page="import"><ImportXlsx /></PageRoute>} />
            <Route path="/logs" element={<PageRoute page="logs"><Logs /></PageRoute>} />
            <Route path="/users" element={<PageRoute page="users"><Users /></PageRoute>} />
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
