
import { useEffect, useState } from 'react'
import { Table, DatePicker, Input, Space } from 'antd'
import { api } from '../api/client'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

const Movements: React.FC = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [eqId, setEqId] = useState('')

  const fetch = async () => {
    setLoading(true)
    const params: any = {}
    if (eqId) params.equipment_id = Number(eqId)
    if (dateRange) {
      params.start_date = dateRange[0].toISOString()
      params.end_date = dateRange[1].toISOString()
    }
    const res = await api.get('/api/movements/', { params })
    setData(res.data)
    setLoading(false)
  }

  useEffect(() => { fetch() }, [dateRange, eqId])

  const columns = [
    { title: 'Оборудование', dataIndex: ['equipment', 'name'] },
    { title: 'Штрихкод', dataIndex: ['equipment', 'barcode'] },
    { title: 'Откуда', dataIndex: ['from_warehouse', 'name'] },
    { title: 'Куда', dataIndex: ['to_warehouse', 'name'] },
    { title: 'Дата', dataIndex: 'timestamp', render: (t: string) => new Date(t).toLocaleString() },
    { title: 'Пользователь', dataIndex: ['user', 'username'] },
    { title: 'Комментарий', dataIndex: 'comment' },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <RangePicker onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)} />
        <Input placeholder="ID оборудования" value={eqId} onChange={e => setEqId(e.target.value)} />
      </Space>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} />
    </div>
  )
}

export default Movements