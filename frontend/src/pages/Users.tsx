import { useEffect, useState } from 'react'
import { Table, Grid, Tag } from 'antd'
import { api } from '../api/client'

const Users: React.FC = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md

  useEffect(() => {
    setLoading(true)
    api.get('/api/users').then(res => setData(res.data)).finally(() => setLoading(false))
  }, [])

  const columns = [
    { title: 'ID', dataIndex: 'id', responsive: ['md'] },
    { title: 'Логин', dataIndex: 'username' },
    { title: 'Имя', dataIndex: 'full_name', responsive: ['sm'] },
    {
      title: 'Роль',
      dataIndex: ['role', 'name'],
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'}>{role === 'admin' ? 'Администратор' : 'Сотрудник'}</Tag>
      ),
    },
  ]

  return <Table columns={columns} dataSource={data} rowKey="id" loading={loading} scroll={{ x: true }} size={isMobile ? 'small' : 'middle'} />
}

export default Users
