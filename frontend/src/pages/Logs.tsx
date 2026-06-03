import { useEffect, useState } from 'react'
import { Table, Grid } from 'antd'
import { api } from '../api/client'

const Logs: React.FC = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md

  useEffect(() => {
    setLoading(true)
    api.get('/api/logs/').then(res => setData(res.data)).finally(() => setLoading(false))
  }, [])

  const columns = [
    { title: 'Дата', dataIndex: 'timestamp', render: (t: string) => new Date(t).toLocaleString(), responsive: ['md'] },
    { title: 'Пользователь', dataIndex: ['user', 'username'] },
    { title: 'Действие', dataIndex: 'action' },
    { title: 'Объект', dataIndex: 'object_type', responsive: ['sm'] },
    { title: 'ID объекта', dataIndex: 'object_id', responsive: ['md'] },
    { title: 'Детали', dataIndex: 'details', responsive: ['lg'] },
  ]

  return <Table columns={columns} dataSource={data} rowKey="id" loading={loading} scroll={{ x: true }} size={isMobile ? 'small' : 'middle'} />
}

export default Logs
