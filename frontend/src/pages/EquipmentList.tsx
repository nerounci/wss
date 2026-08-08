import { useEffect, useState } from 'react'
import { Table, Button, Input, Space, Tag, Select, Row, Col, Grid, Popconfirm, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { api } from '../api/client'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { ColumnsType } from 'antd/es/table'

interface Equipment {
  id: number
  barcode: string
  name: string
  category: string
  quantity: number
  minimum_quantity: number
  current_status: string
  warehouse?: { name: string }
}

interface Warehouse {
  id: number
  name: string
}

const EquipmentList: React.FC = () => {
  const [data, setData] = useState<Equipment[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [warehouseFilter, setWarehouseFilter] = useState<number | undefined>(undefined)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md

  useEffect(() => { api.get('/api/warehouses/').then(res => setWarehouses(res.data)) }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      if (warehouseFilter) params.warehouse_id = warehouseFilter
      const res = await api.get('/api/equipment/', { params })
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [search, statusFilter, warehouseFilter])

  const handleBulkDelete = async () => {
    try {
      const res = await api.delete('/api/equipment/batch', { data: { ids: selectedIds } })
      message.success(`Удалено: ${res.data.deleted}`)
      setSelectedIds([])
      fetchData()
    } catch (err: any) {
      message.error(err.response?.data?.detail || 'Не удалось удалить выбранное')
    }
  }

  const columns: ColumnsType<Equipment> = [
    { title: 'QR-код', dataIndex: 'barcode', key: 'barcode', responsive: ['sm'] },
    { title: 'Наименование', dataIndex: 'name', key: 'name', render: (text, record) => <a onClick={() => navigate(`/equipment/${record.id}`)}>{text}</a> },
    { title: 'Категория', dataIndex: 'category', key: 'category', responsive: ['md'] },
    { title: 'Остаток', key: 'quantity', render: (_, record) => <Tag color={record.quantity <= record.minimum_quantity ? 'red' : 'green'}>{record.quantity}</Tag> },
    { title: 'Статус', dataIndex: 'current_status', key: 'status', render: (status: string) => {
      const color = status === 'Рабочий' ? 'green' : status === 'Выдан' ? 'blue' : status === 'На складе' ? 'cyan' : 'red'
      return <Tag color={color}>{status}</Tag>
    }},
    { title: 'Помещение', dataIndex: ['warehouse', 'name'], key: 'warehouse', responsive: ['sm'] },
    {
      title: '',
      key: 'actions',
      render: (_, record) => (
        <Button type="link" onClick={() => navigate(`/equipment/${record.id}`)}>Открыть</Button>
      )
    }
  ]

  const filterContent = (
    <Space direction={isMobile ? 'vertical' : 'horizontal'} style={{ width: '100%' }}>
      <Input.Search
        placeholder="Поиск по названию..."
        onSearch={setSearch}
        style={{ width: isMobile ? '100%' : 300 }}
        allowClear
      />
      <Select
        placeholder="Фильтр по статусу"
        style={{ width: isMobile ? '100%' : 200 }}
        allowClear
        onChange={(val) => setStatusFilter(val)}
        options={[
          { value: 'Рабочий', label: 'Рабочий' },
          { value: 'Требует ремонта', label: 'Требует ремонта' },
          { value: 'В ремонте', label: 'В ремонте' },
          { value: 'На складе', label: 'На складе' },
          { value: 'Выдан', label: 'Выдан' },
          { value: 'На списание', label: 'На списание' },
        ]}
      />
      <Select
        placeholder="Фильтр по аудитории/складу"
        style={{ width: isMobile ? '100%' : 220 }}
        allowClear
        value={warehouseFilter}
        onChange={(val) => setWarehouseFilter(val)}
        options={warehouses.map(w => ({ value: w.id, label: w.name }))}
      />
    </Space>
  )

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          {filterContent}
        </Col>
        <Col xs={24} md={12} style={{ textAlign: isMobile ? 'left' : 'right', marginTop: isMobile ? 8 : 0 }}>
          <Space>
            {isAdmin && selectedIds.length > 0 && (
              <Popconfirm title={`Удалить выбранные (${selectedIds.length})?`} onConfirm={handleBulkDelete} okText="Удалить" cancelText="Отмена">
                <Button danger>Удалить выбранное ({selectedIds.length})</Button>
              </Popconfirm>
            )}
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/equipment/new')}>
              Добавить
            </Button>
          </Space>
        </Col>
      </Row>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        scroll={{ x: true }}
        size={isMobile ? 'small' : 'middle'}
        rowSelection={isAdmin ? { selectedRowKeys: selectedIds, onChange: keys => setSelectedIds(keys.map(Number)) } : undefined}
      />
    </div>
  )
}

export default EquipmentList
