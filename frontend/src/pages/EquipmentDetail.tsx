import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Descriptions, Button, Space, Select, Input, Table, Tag, message, Card, Typography } from 'antd'
import { ArrowLeftOutlined, SwapOutlined } from '@ant-design/icons'
import { api } from '../api/client'

const statusOptions = [
  'Рабочий', 'Требует ремонта', 'В ремонте', 'На складе', 'Выдан', 'Списан'
]

interface Equipment {
  id: number
  barcode: string
  name: string
  category: string
  serial_number: string
  inventory_number: string
  description: string
  current_status: string
  current_warehouse_id: number | null
  warehouse?: { id: number; name: string }
}

const EquipmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [statusHistory, setStatusHistory] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [moveTo, setMoveTo] = useState<number | undefined>(undefined)
  const [moveComment, setMoveComment] = useState('')
  const [statusComment, setStatusComment] = useState('')

  useEffect(() => {
    if (!id) return
    api.get(`/api/equipment/${id}`).then(res => setEquipment(res.data))
    api.get(`/api/equipment/${id}/status-history`).then(res => setStatusHistory(res.data))
    api.get('/api/warehouses/').then(res => setWarehouses(res.data))
  }, [id])

  const handleStatusChange = async (newStatus: string) => {
    try {
      await api.put(`/api/equipment/${id}/status`, null, { params: { new_status: newStatus, comment: statusComment } })
      message.success('Статус изменён')
      const eqRes = await api.get(`/api/equipment/${id}`)
      setEquipment(eqRes.data)
      const histRes = await api.get(`/api/equipment/${id}/status-history`)
      setStatusHistory(histRes.data)
      setStatusComment('')
    } catch (err: any) {
      message.error(err.response?.data?.detail || 'Ошибка')
    }
  }

  const handleMove = async () => {
    if (!moveTo || !equipment) return
    if (moveTo === equipment.current_warehouse_id) {
      message.error('Оборудование уже на этом складе')
      return
    }
    try {
      await api.post('/api/movements/', {
        equipment_id: equipment.id,
        to_warehouse_id: moveTo,
        comment: moveComment
      })
      message.success('Перемещено')
      const eqRes = await api.get(`/api/equipment/${id}`)
      setEquipment(eqRes.data)
      setMoveTo(undefined)
      setMoveComment('')
    } catch (err: any) {
      message.error(err.response?.data?.detail || 'Ошибка')
    }
  }

  if (!equipment) return <div>Загрузка...</div>

  const statusColor = (status: string) => {
    if (status === 'Рабочий') return 'green'
    if (status === 'Выдан') return 'blue'
    if (status === 'На складе') return 'cyan'
    return 'red'
  }

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/equipment')}>Назад к списку</Button>
      <Card style={{ marginTop: 16 }}>
        <Descriptions title={`Оборудование #${equipment.id}`} bordered>
          <Descriptions.Item label="Штрихкод">{equipment.barcode}</Descriptions.Item>
          <Descriptions.Item label="Наименование">{equipment.name}</Descriptions.Item>
          <Descriptions.Item label="Категория">{equipment.category}</Descriptions.Item>
          <Descriptions.Item label="Серийный номер">{equipment.serial_number}</Descriptions.Item>
          <Descriptions.Item label="Инвентарный номер">{equipment.inventory_number}</Descriptions.Item>
          <Descriptions.Item label="Описание">{equipment.description}</Descriptions.Item>
          <Descriptions.Item label="Статус">
            <Tag color={statusColor(equipment.current_status)}>{equipment.current_status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Текущий склад">
            {equipment.warehouse?.name || 'Не указан'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Изменить статус" style={{ marginTop: 16 }}>
        <Space>
          <Select
            style={{ width: 200 }}
            value={undefined}
            placeholder="Выберите новый статус"
            onChange={(val) => handleStatusChange(val)}
            options={statusOptions.map(s => ({ value: s, label: s }))}
          />
          <Input placeholder="Комментарий" value={statusComment} onChange={e => setStatusComment(e.target.value)} />
        </Space>
      </Card>

      <Card title="Переместить на другой склад" style={{ marginTop: 16 }}>
        <Space>
          <Select
            style={{ width: 300 }}
            placeholder="Выберите склад"
            value={moveTo}
            onChange={setMoveTo}
            options={warehouses
              .filter(w => w.id !== equipment.current_warehouse_id)
              .map(w => ({ value: w.id, label: w.name }))}
          />
          <Input placeholder="Комментарий" value={moveComment} onChange={e => setMoveComment(e.target.value)} />
          <Button type="primary" icon={<SwapOutlined />} onClick={handleMove}>Переместить</Button>
        </Space>
      </Card>

      <Card title="История статусов" style={{ marginTop: 16 }}>
        <Table
          dataSource={statusHistory}
          rowKey="id"
          columns={[
            { title: 'Дата', dataIndex: 'timestamp', render: (t: string) => new Date(t).toLocaleString() },
            { title: 'Старый статус', dataIndex: 'old_status', render: (s: string) => s ? <Tag>{s}</Tag> : '-' },
            { title: 'Новый статус', dataIndex: 'new_status', render: (s: string) => <Tag color={statusColor(s)}>{s}</Tag> },
            { title: 'Комментарий', dataIndex: 'comment' },
            { title: 'Пользователь', dataIndex: ['changed_by', 'username'] },
          ]}
        />
      </Card>
    </div>
  )
}

export default EquipmentDetail
