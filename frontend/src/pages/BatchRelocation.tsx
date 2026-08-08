import { useEffect, useState } from 'react'
import { Alert, Button, Card, Col, Grid, Input, message, Row, Select, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { SwapOutlined } from '@ant-design/icons'
import { api } from '../api/client'

interface Warehouse {
  id: number
  name: string
}

interface EquipmentItem {
  id: number
  name: string
  barcode?: string
  equipment_type?: string
  location_label?: string
  current_status: string
  quantity: number
}

const BatchRelocation: React.FC = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [sourceId, setSourceId] = useState<number | undefined>()
  const [destinationId, setDestinationId] = useState<number | undefined>()
  const [equipment, setEquipment] = useState<EquipmentItem[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [comment, setComment] = useState('Перестановка оборудования')
  const [loading, setLoading] = useState(false)
  const [moving, setMoving] = useState(false)
  const isMobile = !Grid.useBreakpoint().md

  useEffect(() => {
    api.get('/api/warehouses/').then(response => setWarehouses(response.data))
  }, [])

  useEffect(() => {
    setSelectedIds([])
    if (!sourceId) {
      setEquipment([])
      return
    }
    setLoading(true)
    api.get('/api/equipment/', { params: { warehouse_id: sourceId } })
      .then(response => setEquipment(response.data))
      .finally(() => setLoading(false))
  }, [sourceId])

  const moveEquipment = async () => {
    if (!destinationId) {
      message.error('Выберите аудиторию или склад назначения')
      return
    }
    if (!selectedIds.length) {
      message.error('Выберите оборудование для перемещения')
      return
    }
    if (sourceId === destinationId) {
      message.error('Аудитория назначения должна отличаться от исходной')
      return
    }
    setMoving(true)
    try {
      const response = await api.post('/api/movements/batch', {
        equipment_ids: selectedIds,
        to_warehouse_id: destinationId,
        comment: comment.trim() || undefined,
      })
      message.success(`Перемещено позиций: ${response.data.moved_count}`)
      setSelectedIds([])
      setEquipment(current => current.filter(item => !selectedIds.includes(item.id)))
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Не удалось выполнить перемещение')
    } finally {
      setMoving(false)
    }
  }

  const columns: ColumnsType<EquipmentItem> = [
    { title: 'Наименование', dataIndex: 'name' },
    { title: 'Штрихкод', dataIndex: 'barcode', responsive: ['sm'] },
    { title: 'Место', dataIndex: 'location_label', render: value => value || '—', responsive: ['md'] },
    { title: 'Количество', dataIndex: 'quantity', responsive: ['md'] },
    { title: 'Статус', dataIndex: 'current_status', render: status => <Tag>{status}</Tag> },
  ]

  return (
    <div>
      <Typography.Title level={isMobile ? 3 : 2}>Массовая перестановка</Typography.Title>
      <Alert type="info" showIcon message="Выберите исходную аудиторию, отметьте оборудование и перенесите его одним действием. Для обмена трёх аудиторий повторите операцию для каждой исходной аудитории." style={{ marginBottom: 16 }} />
      <Card>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={8}><Select value={sourceId} onChange={setSourceId} options={warehouses.map(item => ({ value: item.id, label: item.name }))} placeholder="Откуда: аудитория / склад" style={{ width: '100%' }} /></Col>
          <Col xs={24} md={8}><Select value={destinationId} onChange={setDestinationId} options={warehouses.filter(item => item.id !== sourceId).map(item => ({ value: item.id, label: item.name }))} placeholder="Куда: аудитория / склад" style={{ width: '100%' }} /></Col>
          <Col xs={24} md={8}><Input value={comment} onChange={event => setComment(event.target.value)} placeholder="Комментарий к перестановке" /></Col>
        </Row>
        <Space style={{ margin: '16px 0' }}>
          <Button type="primary" icon={<SwapOutlined />} loading={moving} onClick={moveEquipment}>Переместить выбранное ({selectedIds.length})</Button>
        </Space>
        <Table
          columns={columns}
          dataSource={equipment}
          rowKey="id"
          loading={loading}
          rowSelection={{ selectedRowKeys: selectedIds, onChange: keys => setSelectedIds(keys.map(Number)) }}
          scroll={{ x: true }}
          size={isMobile ? 'small' : 'middle'}
        />
      </Card>
    </div>
  )
}

export default BatchRelocation
