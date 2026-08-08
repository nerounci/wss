import { useEffect, useState } from 'react'
import { Card, Col, Grid, Row, Select, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { api } from '../api/client'
import { useNavigate } from 'react-router-dom'

const { useBreakpoint } = Grid

const typeOptions = [
  { value: 'computer', label: 'Компьютеры' },
  { value: 'printer', label: 'Принтеры' },
  { value: 'phone', label: 'Телефоны' },
  { value: 'monitor', label: 'Мониторы' },
  { value: 'other', label: 'Другая техника' },
]

interface TechnologyItem {
  id: number
  name: string
  barcode?: string
  equipment_type: string
  location_label?: string
  current_status: string
  warehouse?: { id: number; name: string }
}

const Technology: React.FC = () => {
  const [items, setItems] = useState<TechnologyItem[]>([])
  const [warehouses, setWarehouses] = useState<{ id: number; name: string }[]>([])
  const [equipmentType, setEquipmentType] = useState<string | undefined>()
  const [warehouseId, setWarehouseId] = useState<number | undefined>()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const isMobile = !useBreakpoint().md

  useEffect(() => { api.get('/api/warehouses/').then(response => setWarehouses(response.data)) }, [])
  useEffect(() => {
    setLoading(true)
    api.get('/api/equipment/', { params: { technical_only: true, equipment_type: equipmentType, warehouse_id: warehouseId } })
      .then(response => setItems(response.data))
      .finally(() => setLoading(false))
  }, [equipmentType, warehouseId])

  const columns: ColumnsType<TechnologyItem> = [
    { title: 'Наименование', dataIndex: 'name', render: (name, item) => <a onClick={() => navigate(`/equipment/${item.id}`)}>{name}</a> },
    { title: 'Тип', dataIndex: 'equipment_type', render: value => typeOptions.find(option => option.value === value)?.label || value },
    { title: 'Аудитория / место', dataIndex: ['warehouse', 'name'], render: value => value || 'Не указано' },
    { title: 'Место в аудитории', dataIndex: 'location_label', render: value => value || 'Не указано', responsive: ['md'] },
    { title: 'Статус', dataIndex: 'current_status', render: value => <Tag>{value}</Tag> },
  ]

  return (
    <div>
      <Card title="Техника в аудиториях">
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={8}><Select allowClear value={equipmentType} onChange={setEquipmentType} options={typeOptions} placeholder="Все компьютеры, принтеры, телефоны…" style={{ width: '100%' }} /></Col>
          <Col xs={24} md={8}><Select allowClear value={warehouseId} onChange={setWarehouseId} options={warehouses.map(item => ({ value: item.id, label: item.name }))} placeholder="Все аудитории / места" style={{ width: '100%' }} /></Col>
        </Row>
        <Table columns={columns} dataSource={items} rowKey="id" loading={loading} scroll={{ x: true }} size={isMobile ? 'small' : 'middle'} />
      </Card>
    </div>
  )
}

export default Technology
