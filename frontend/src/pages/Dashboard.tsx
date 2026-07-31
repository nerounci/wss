import { useEffect, useState } from 'react'
import { Alert, Card, Col, Grid, List, Row, Statistic, Tag, Typography } from 'antd'
import { EnvironmentOutlined, SwapOutlined, ToolOutlined, WarningOutlined } from '@ant-design/icons'
import { api } from '../api/client'

const { useBreakpoint } = Grid

interface LowStockEquipment {
  id: number
  name: string
  quantity: number
  minimum_quantity: number
  warehouse?: { name: string }
}

interface RecentChange {
  id: number
  action: string
  details?: string
  timestamp: string
  user?: { full_name?: string; username: string }
}

interface DashboardData {
  equipment_count: number
  warehouse_count: number
  movement_count: number
  low_stock: LowStockEquipment[]
  recent_changes: RecentChange[]
}

const actionLabels: Record<string, string> = {
  create: 'Добавление',
  update: 'Изменение',
  move: 'Перемещение',
  change_status: 'Изменение статуса',
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | nusll>(null)
  const screens = useBreakpoint()
  const isMobile = !screens.md

  useEffect(() => {
    api.get('/api/dashboard/').then(response => setData(response.data))
  }, [])

  return (
    <div>
      <Typography.Title level={isMobile ? 3 : 2}>Дашборд</Typography.Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}><Card loading={!data}><Statistic title="Позиций оборудования" value={data?.equipment_count ?? 0} prefix={<ToolOutlined />} /></Card></Col>
        <Col xs={24} sm={8}><Card loading={!data}><Statistic title="Складов" value={data?.warehouse_count ?? 0} prefix={<EnvironmentOutlined />} /></Card></Col>
        <Col xs={24} sm={8}><Card loading={!data}><Statistic title="Перемещений" value={data?.movement_count ?? 0} prefix={<SwapOutlined />} /></Card></Col>
      </Row>

      <Card title="Низкий остаток" style={{ marginTop: 16 }} loading={!data}>
        {data?.low_stock.length ? (
          <>
            <Alert showIcon type="warning" icon={<WarningOutlined />} message={`Проверьте ${data.low_stock.length} поз. с низким остатком`} style={{ marginBottom: 12 }} />
            <List dataSource={data.low_stock} renderItem={item => (
              <List.Item>
                <List.Item.Meta title={item.name} description={item.warehouse?.name || 'Склад не указан'} />
                <Tag color="red">{item.quantity} из мин. {item.minimum_quantity}</Tag>
              </List.Item>
            )} />
          </>
        ) : <Typography.Text type="secondary">Нет позиций с низким остатком.</Typography.Text>}
      </Card>

      <Card title="Последние изменения за 7 дней" style={{ marginTop: 16 }} loading={!data}>
        {data?.recent_changes.length ? (
          <List dataSource={data.recent_changes} renderItem={item => (
            <List.Item>
              <List.Item.Meta
                title={<><Tag>{actionLabels[item.action] || item.action}</Tag>{item.details || 'Без описания'}</>}
                description={`${new Date(item.timestamp).toLocaleString()} · ${item.user?.full_name || item.user?.username || 'Система'}`}
              />
            </List.Item>
          )} />
        ) : <Typography.Text type="secondary">За последние 7 дней изменений не было.</Typography.Text>}
      </Card>
    </div>
  )
}

export default Dashboard
