import { useState, useEffect } from 'react'
import { Form, Input, Select, Button, Card, message, Space, Grid } from 'antd'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'

const { useBreakpoint } = Grid

const statusOptions = ['Рабочий', 'Требует ремонта', 'В ремонте', 'На складе', 'Выдан', 'Списан']

const EquipmentCreate: React.FC = () => {
  const [form] = Form.useForm()
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const screens = useBreakpoint()
  const isMobile = !screens.md

  useEffect(() => {
    api.get('/api/warehouses/').then(res => setWarehouses(res.data)).catch(() => message.error('Ошибка загрузки складов'))
  }, [])

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      await api.post('/api/equipment/', values)
      message.success('Оборудование создано')
      navigate('/equipment')
    } catch (err: any) {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        // ошибки валидации pydantic
        detail.forEach((d: any) => message.error(d.msg))
      } else {
        message.error(detail || 'Ошибка создания')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title="Добавление оборудования" style={{ maxWidth: 600, margin: '0 auto' }}>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="barcode" label="Штрихкод (необязательно)">
          <Input placeholder="Оставьте пустым для автогенерации" />
        </Form.Item>
        <Form.Item name="name" label="Наименование" rules={[{ required: true, message: 'Введите наименование' }]}>
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
            allowClear
            placeholder="Выберите склад"
            options={warehouses.map(w => ({ value: w.id, label: w.name }))}
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block={isMobile}>
            Создать
          </Button>
        </Form.Item>
      </Form>
    </Card>
  )
}

export default EquipmentCreate
