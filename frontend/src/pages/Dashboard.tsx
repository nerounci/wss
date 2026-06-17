import { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Typography, Grid } from 'antd'
import { ToolOutlined, EnvironmentOutlined, SwapOutlined } from '@ant-design/icons'
import { api } from '../api/client'

const { useBreakpoint } = Grid

const Dashboard: React.FC = () => {
  const [eqCount, setEqCount] = useState(0)
  const [whCount, setWhCount] = useState(0)
  const [moveCount, setMoveCount] = useState(0)
  const screens = useBreakpoint()
  const isMobile = !screens.md

  useEffect(() => {
    api.get('/api/equipment/?limit=1').then(res => setEqCount(res.data.length))
    api.get('/api/warehouses/?limit=1').then(res => setWhCount(res.data.length))
    api.get('/api/movements/?limit=1').then(res => setMoveCount(res.data.length))
  }, [])

  return (
    <div>
      <Typography.Title level={isMobile ? 3 : 2}>Дашборд</Typography.Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Оборудование" value={eqCount} prefix={<ToolOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Склады" value={whCount} prefix={<EnvironmentOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Перемещения" value={moveCount} prefix={<SwapOutlined />} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
