import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Descriptions, Button, Space, Select, Input, InputNumber, Table, Tag, message, Card, Grid, Popconfirm } from 'antd'
import { ArrowLeftOutlined, SwapOutlined } from '@ant-design/icons'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

const statusOptions = ['Рабочий', 'Требует ремонта', 'В ремонте', 'На складе', 'Выдан', 'Списан']
const equipmentTypeOptions = [
  { value: 'computer', label: 'Компьютер' },
  { value: 'printer', label: 'Принтер' },
  { value: 'phone', label: 'Телефон' },
  { value: 'monitor', label: 'Монитор' },
  { value: 'other', label: 'Другая техника' },
]

interface Equipment {
  id: number
  barcode: string
  name: string
  category: string
  serial_number: string
  inventory_number: string
  description: string
  equipment_type?: string
  location_label?: string
  quantity: number
  minimum_quantity: number
  current_status: string
  current_warehouse_id: number | null
  warehouse?: { id: number; name: string }
}

const EquipmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [statusHistory, setStatusHistory] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [moveTo, setMoveTo] = useState<number | undefined>(undefined)
  const [moveComment, setMoveComment] = useState('')
  const [statusComment, setStatusComment] = useState('')
  const [quantity, setQuantity] = useState<number | null>(null)
  const [minimumQuantity, setMinimumQuantity] = useState<number | null>(null)
  const [equipmentType, setEquipmentType] = useState<string | undefined>()
  const [locationLabel, setLocationLabel] = useState('')
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md

  useEffect(() => {
    if (!id || id === 'new') {
      navigate('/equipment', { replace: true })
      return
    }
    const numId = Number(id)
    if (isNaN(numId)) {
      navigate('/equipment', { replace: true })
      return
    }
    api.get(`/api/equipment/${numId}`).then(res => {
      setEquipment(res.data)
      setQuantity(res.data.quantity)
      setMinimumQuantity(res.data.minimum_quantity)
      setEquipmentType(res.data.equipment_type)
      setLocationLabel(res.data.location_label || '')
    })
    api.get(`/api/equipment/${numId}/status-history`).then(res => setStatusHistory(res.data))
    api.get('/api/warehouses/').then(res => setWarehouses(res.data))
  }, [id, navigate])

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

  const refreshEquipment = async () => {
    const response = await api.get(`/api/equipment/${id}`)
    setEquipment(response.data)
    setQuantity(response.data.quantity)
    setMinimumQuantity(response.data.minimum_quantity)
    setEquipmentType(response.data.equipment_type)
    setLocationLabel(response.data.location_label || '')
  }

  const saveQuantity = async () => {
    if (quantity === null || minimumQuantity === null) return
    try {
      await api.put(`/api/equipment/${id}`, {
        quantity,
        minimum_quantity: minimumQuantity,
        equipment_type: equipmentType || null,
        location_label: locationLabel.trim() || null,
      })
      await refreshEquipment()
      message.success('Количество обновлено')
    } catch (err: any) {
      message.error(err.response?.data?.detail || 'Не удалось обновить количество')
    }
  }

  const deleteEquipment = async () => {
    try {
      await api.delete(`/api/equipment/${id}`)
      message.success('Оборудование удалено')
      navigate('/equipment')
    } catch (err: any) {
      message.error(err.response?.data?.detail || 'Не удалось удалить оборудование')
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
        <Descriptions title={`Оборудование #${equipment.id}`} bordered column={isMobile ? 1 : 2} layout={isMobile ? 'vertical' : 'horizontal'}>
          <Descriptions.Item label="QR-код">{equipment.barcode || '—'}</Descriptions.Item>
          <Descriptions.Item label="Наименование">{equipment.name}</Descriptions.Item>
          <Descriptions.Item label="Категория">{equipment.category || '—'}</Descriptions.Item>
          <Descriptions.Item label="Тип техники">{equipment.equipment_type || '—'}</Descriptions.Item>
          <Descriptions.Item label="Место в аудитории">{equipment.location_label || '—'}</Descriptions.Item>
          <Descriptions.Item label="Серийный номер">{equipment.serial_number || '—'}</Descriptions.Item>
          <Descriptions.Item label="Инвентарный номер">{equipment.inventory_number || '—'}</Descriptions.Item>
          <Descriptions.Item label="Описание">{equipment.description || '—'}</Descriptions.Item>
          <Descriptions.Item label="Количество">{equipment.quantity}</Descriptions.Item>
          <Descriptions.Item label="Минимальный остаток">{equipment.minimum_quantity}</Descriptions.Item>
          <Descriptions.Item label="Статус">
            <Tag color={statusColor(equipment.current_status)}>{equipment.current_status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Текущий склад">
            {equipment.warehouse?.name || 'Не указан'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
      {isAdmin && (
        <Card title="Количество и классификация" style={{ marginTop: 16 }}>
          <Space direction={isMobile ? 'vertical' : 'horizontal'} style={{ width: '100%' }}>
            <InputNumber min={0} precision={0} value={quantity ?? equipment.quantity} onChange={value => setQuantity(value)} addonBefore="Количество" />
            <InputNumber min={0} precision={0} value={minimumQuantity ?? equipment.minimum_quantity} onChange={value => setMinimumQuantity(value)} addonBefore="Мин. остаток" />
            <Select allowClear value={equipmentType} onChange={setEquipmentType} placeholder="Тип техники" options={equipmentTypeOptions} style={{ minWidth: 180 }} />
            <Input value={locationLabel} onChange={event => setLocationLabel(event.target.value)} placeholder="Место в аудитории" style={{ minWidth: 220 }} />
            <Button type="primary" onClick={saveQuantity}>Сохранить</Button>
            <Popconfirm title="Удалить оборудование?" description="Действие нельзя отменить." okText="Удалить" cancelText="Отмена" onConfirm={deleteEquipment}>
              <Button danger>Удалить</Button>
            </Popconfirm>
          </Space>
        </Card>
      )}
      <Card title="Изменить статус" style={{ marginTop: 16 }}>
        <Space direction={isMobile ? 'vertical' : 'horizontal'} style={{ width: '100%' }}>
          <Select style={{ width: isMobile ? '100%' : 200 }} value={undefined} placeholder="Выберите новый статус" onChange={(val) => handleStatusChange(val)} options={statusOptions.map(s => ({ value: s, label: s }))} />
          <Input placeholder="Комментарий" value={statusComment} onChange={e => setStatusComment(e.target.value)} />
        </Space>
      </Card>
      <Card title="Переместить на другой склад" style={{ marginTop: 16 }}>
        <Space direction={isMobile ? 'vertical' : 'horizontal'} style={{ width: '100%' }}>
          <Select style={{ width: isMobile ? '100%' : 300 }} placeholder="Выберите склад" value={moveTo} onChange={setMoveTo} options={warehouses.filter(w => w.id !== equipment.current_warehouse_id).map(w => ({ value: w.id, label: w.name }))} />
          <Input placeholder="Комментарий" value={moveComment} onChange={e => setMoveComment(e.target.value)} />
          <Button type="primary" icon={<SwapOutlined />} onClick={handleMove}>Переместить</Button>
        </Space>
      </Card>
      <Card title="История статусов" style={{ marginTop: 16 }}>
        <Table dataSource={statusHistory} rowKey="id" scroll={{ x: true }} size={isMobile ? 'small' : 'middle'} columns={[
          { title: 'Дата', dataIndex: 'timestamp', render: (t: string) => new Date(t).toLocaleString() },
          { title: 'Старый статус', dataIndex: 'old_status', render: (s: string) => s ? <Tag>{s}</Tag> : '—' },
          { title: 'Новый статус', dataIndex: 'new_status', render: (s: string) => <Tag color={statusColor(s)}>{s}</Tag> },
          { title: 'Комментарий', dataIndex: 'comment', responsive: ['md'] },
          { title: 'Пользователь', dataIndex: ['changed_by', 'username'], responsive: ['sm'] },
        ]} />
      </Card>
    </div>
  )
}

export default EquipmentDetail
