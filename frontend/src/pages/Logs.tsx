import { useEffect, useState } from 'react'
import { Table, Grid, Tag, Select, Input, Space } from 'antd'
import { api } from '../api/client'
import { ACTION_LABELS } from '../constants'

interface UserOption {
  id: number
  username: string
  full_name?: string
}

const Logs: React.FC = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<UserOption[]>([])
  const [userFilter, setUserFilter] = useState<number | undefined>(undefined)
  const [search, setSearch] = useState('')
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md

  useEffect(() => { api.get('/api/users').then(res => setUsers(res.data)).catch(() => {}) }, [])

  useEffect(() => {
    setLoading(true)
    const params: any = {}
    if (userFilter) params.user_id = userFilter
    if (search) params.search = search
    api.get('/api/logs/', { params }).then(res => setData(res.data)).finally(() => setLoading(false))
  }, [userFilter, search])

  const columns = [
    { title: 'Дата', dataIndex: 'timestamp', render: (t: string) => new Date(t).toLocaleString(), responsive: ['md'] },
    { title: 'Пользователь', dataIndex: ['user', 'username'] },
    { title: 'Действие', dataIndex: 'action', render: (action: string) => <Tag>{ACTION_LABELS[action] || action}</Tag> },
    { title: 'Объект', dataIndex: 'object_type', render: (t: string) => t === 'equipment' ? 'Оборудование' : t, responsive: ['sm'] },
    { title: 'ID объекта', dataIndex: 'object_id', responsive: ['md'] },
    { title: 'Детали', dataIndex: 'details', responsive: ['lg'] },
  ]

  return (
    <div>
      <Space direction={isMobile ? 'vertical' : 'horizontal'} style={{ marginBottom: 16, width: '100%' }}>
        <Select
          placeholder="Фильтр по пользователю"
          allowClear
          style={{ width: isMobile ? '100%' : 220 }}
          value={userFilter}
          onChange={setUserFilter}
          options={users.map(u => ({ value: u.id, label: u.full_name || u.username }))}
        />
        <Input.Search
          placeholder="Поиск по деталям (например, по названию аудитории)"
          allowClear
          onSearch={setSearch}
          style={{ width: isMobile ? '100%' : 320 }}
        />
      </Space>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} scroll={{ x: true }} size={isMobile ? 'small' : 'middle'} />
    </div>
  )
}

export default Logs
