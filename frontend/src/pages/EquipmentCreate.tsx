import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, Select, message } from 'antd'
import { api } from '../api/client'

const statusOptions = [
  'Рабочий', 'Требует ремонта', 'В ремонте', 'На складе', 'Выдан', 'Списан'
]

const EquipmentCreate: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [warehouses, setWarehouses] = useState<any[]>([])

  useState(() => {
    api.get('/api/warehouses/').then(res => setWarehouses(res.data))
  }, [])

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      await api.post('/api/equipment/', values)
      message.success('Оборудование создано')
      navigate('/equipment')
    } catch (err: any) {
      message.error(err.response?.data?.detail || 'Ошибка создания')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Card title="Добавить новое оборудование">
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="barcode" label="Штрихкод" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="Наименование" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="Категория">
            <Input />
          </Form.Item>
          <Form.Item name="serial_number" label="Серийный номер">
            <Input />
          </Form.Item>
          <Form.Item name="inventory_number" label="Инвентарный номер">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Описание">
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="current_status" label="Статус" initialValue="На складе">
            <Select options={statusOptions.map(s => ({ value: s, label: s }))} />
          </Form.Item>
          <Form.Item name="current_warehouse_id" label="Склад">
            <Select
              placeholder="Выберите склад"
              options={warehouses.map(w => ({ value: w.id, label: w.name }))}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Создать
            </Button>
            <Button style={{ marginLeft: 8 }} onClick={() => navigate('/equipment')}>
              Отмена
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default EquipmentCreate
