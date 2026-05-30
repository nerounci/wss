
import { useEffect, useState } from 'react'
import { Table } from 'antd'
import { api } from '../api/client'

const Logs: React.FC = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get('/api/logs/').then(res => setData(res.data)).finally(() => setLoading(false))
  }, [])

  const columns = [
    { title: 'Дата', dataIndex: 'timestamp', render: (t: string) => new Date(t).toLocaleString() },
    { title: 'Пользователь', dataIndex: ['user', 'username'] },
    { title: 'Действие', dataIndex: 'action' },
    { title: 'Объект', dataIndex: 'object_type' },
    { title: 'ID объекта', dataIndex: 'object_id' },
    { title: 'Детали', dataIndex: 'details' },
  ]

  return <Table columns={columns} dataSource={data} rowKey="id" loading={loading} />
}

export default Logs