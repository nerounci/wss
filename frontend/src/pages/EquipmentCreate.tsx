// frontend/src/pages/EquipmentCreate.tsx
import { useState, useEffect } from 'react'
import { Form, Input, InputNumber, Select, Button, Card, message, Grid } from 'antd'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'

const { useBreakpoint } = Grid

const statusOptions = ['Рабочий', 'Требует ремонта', 'В ремонте', 'На складе', 'Выдан', 'Списан']
const equipmentTypeOptions = [
  { value: 'computer', label: 'Компьютер' },
  { value: 'printer', label: 'Принтер' },
  { value: 'phone', label: 'Телефон' },
  { value: 'monitor', label: 'Монитор' },
  { value: 'other', label: 'Другая техника' },
]

const EquipmentCreate: React.FC = () => {
  const [form] = Form.useForm()
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const screens = useBreakpoint()
  const isMobile = !screens.md

  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        console.log('📦 Загрузка складов...')
        const response = await api.get('/api/warehouses')
        console.log('✅ Склады загружены:', response.data)
        setWarehouses(response.data)
      } catch (error) {
        console.error('❌ Ошибка загрузки складов:', error)
        message.error('Ошибка загрузки складов')
      }
    }
    loadWarehouses()
  }, [])

  const onFinish = async (values: any) => {
    console.log('📝 Форма отправлена:', values)
    
    // Проверка обязательных полей
    if (!values.name) {
      message.error('Введите наименование оборудования')
      return
    }

    setLoading(true)
    try {
      // Подготовка данных
      const payload = {
        name: values.name.trim(),
        barcode: values.barcode?.trim() || undefined,
        category: values.category || undefined,
        serial_number: values.serial_number || undefined,
        inventory_number: values.inventory_number || undefined,
        description: values.description || undefined,
        equipment_type: values.equipment_type || undefined,
        location_label: values.location_label?.trim() || undefined,
        quantity: values.quantity,
        minimum_quantity: values.minimum_quantity,
        current_status: values.current_status || 'На складе',
        current_warehouse_id: values.current_warehouse_id || null,
      }

      console.log('🚀 Отправка данных:', payload)
      
      const response = await api.post('/api/equipment', payload)
      console.log('✅ Успешно создано:', response.data)
      
      message.success('Оборудование успешно создано')
      form.resetFields()
      navigate('/equipment')
      
    } catch (err: any) {
      console.error('❌ Ошибка создания:', err)
      console.error('📦 Данные ошибки:', err.response?.data)
      
      // Обработка ошибок валидации
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail
        if (Array.isArray(detail)) {
          detail.forEach((d: any) => {
            message.error(`${d.loc?.join('.')}: ${d.msg}`)
          })
        } else if (typeof detail === 'string') {
          message.error(detail)
        } else {
          message.error('Ошибка создания оборудования')
        }
      } else {
        message.error('Ошибка соединения с сервером')
      }
    } finally {
      setLoading(false)
    }
  }

  const onFinishFailed = (errorInfo: any) => {
    console.error('❌ Ошибки валидации формы:', errorInfo)
    message.error('Заполните все обязательные поля')
  }

  return (
    <Card title="Добавление оборудования" style={{ maxWidth: 600, margin: '0 auto' }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        initialValues={{
          current_status: 'На складе',
          quantity: 1,
          minimum_quantity: 0,
        }}
      >
        <Form.Item 
          name="name" 
          label="Наименование" 
          rules={[{ required: true, message: 'Введите наименование' }]}
        >
          <Input placeholder="Введите название оборудования" />
        </Form.Item>

        <Form.Item 
          name="barcode" 
          label="Штрихкод"
          extra="Оставьте пустым для автогенерации"
        >
          <Input placeholder="Штрихкод" />
        </Form.Item>

        <Form.Item name="category" label="Категория">
          <Input placeholder="Например: Компьютерная техника" />
        </Form.Item>

        <Form.Item name="equipment_type" label="Тип техники">
          <Select allowClear placeholder="Выберите для компьютеров, принтеров, телефонов и т. п." options={equipmentTypeOptions} />
        </Form.Item>

        <Form.Item name="location_label" label="Место в аудитории" extra="Например: «Компьютер преподавателя», «Ученический компьютер №1», «Принтер у входа»." >
          <Input placeholder="Укажите место или назначение" />
        </Form.Item>

        <Form.Item name="serial_number" label="Серийный номер">
          <Input placeholder="Серийный номер" />
        </Form.Item>

        <Form.Item name="inventory_number" label="Инвентарный номер">
          <Input placeholder="Инвентарный номер" />
        </Form.Item>

        <Form.Item name="description" label="Описание">
          <Input.TextArea rows={3} placeholder="Дополнительная информация" />
        </Form.Item>

        <Form.Item name="quantity" label="Количество" rules={[{ required: true, message: 'Укажите количество' }]}>
          <InputNumber min={0} precision={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="minimum_quantity" label="Минимальный остаток" extra="На дашборде появится уведомление, когда остаток станет не больше этого значения.">
          <InputNumber min={0} precision={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item 
          name="current_status" 
          label="Статус"
          rules={[{ required: true, message: 'Выберите статус' }]}
        >
          <Select options={statusOptions.map(s => ({ value: s, label: s }))} />
        </Form.Item>

        <Form.Item name="current_warehouse_id" label="Склад">
          <Select
            allowClear
            placeholder="Выберите склад"
            options={warehouses.map(w => ({ 
              value: w.id, 
              label: w.name 
            }))}
            loading={warehouses.length === 0}
          />
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading} 
            block={isMobile}
            size="large"
          >
            {loading ? 'Создание...' : 'Создать оборудование'}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  )
}

export default EquipmentCreate
