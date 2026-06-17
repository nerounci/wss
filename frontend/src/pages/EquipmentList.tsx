import { useEffect, useState } from 'react'
import { Table, Button, Input, Space, Tag, Select, Row, Col, Grid } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { api } from '../api/client'
import { useNavigate } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'

interface Equipment {
  id: number
  barcode: string
  name: string
  category: string
  current_status: string
  warehouse?: { name: string }
}

const EquipmentList: React.FC = () => {
  const [data, setData] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const navigate = useNavigate()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      const res = await api.get('/api/equipment/', { params })
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [search, statusFilter])

  const columns: ColumnsType<Equipment> = [
    { title: 'Штрихкод', dataIndex: 'barcode', key: 'barcode', responsive: ['sm'] },
    { title: 'Наименование', dataIndex: 'name', key: 'name', render: (text, record) => <a onClick={() => navigate(`/equipment/${record.id}`)}>{text}</a> },
    { title: 'Категория', dataIndex: 'category', key: 'category', responsive: ['md'] },
    { title: 'Статус', dataIndex: 'current_status', key: 'status', render: (status: string) => {
      const color = status === 'Рабочий' ? 'green' : status === 'Выдан' ? 'blue' : status === 'На складе' ? 'cyan' : 'red'
      return <Tag color={color}>{status}</Tag>
    }},
    { title: 'Склад', dataIndex: ['warehouse', 'name'], key: 'warehouse', responsive: ['sm'] },
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
          { value: 'Списан', label: 'Списан' },
        ]}
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
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/equipment/new')}>
            Добавить
          </Button>
        </Col>
      </Row>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        scroll={{ x: true }}
        size={isMobile ? 'small' : 'middle'}
      />
    </div>
  )
}

export default EquipmentList
