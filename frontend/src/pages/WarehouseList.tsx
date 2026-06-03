import { useEffect, useState } from 'react'
import { Button, Table, Space, Modal, Input, Form, message, Row, Col, Grid } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { api } from '../api/client'
import { useNavigate } from 'react-router-dom'

interface Warehouse {
  id: number
  name: string
  address: string
  description: string
}

const WarehouseList: React.FC = () => {
  const [data, setData] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editing, setEditing] = useState<Warehouse | null>(null)
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md

  const fetch = async () => {
    setLoading(true)
    const res = await api.get('/api/warehouses/')
    setData(res.data)
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  const handleSave = async () => {
    const values = await form.validateFields()
    if (editing) {
      await api.put(`/api/warehouses/${editing.id}`, values)
      message.success('Склад обновлён')
    } else {
      await api.post('/api/warehouses/', values)
      message.success('Склад создан')
    }
    setModalVisible(false)
    setEditing(null)
    form.resetFields()
    fetch()
  }

  const handleDelete = async (id: number) => {
    await api.delete(`/api/warehouses/${id}`)
    message.success('Удалён')
    fetch()
  }

  const columns = [
    { title: 'Название', dataIndex: 'name', key: 'name', render: (text: string, record: Warehouse) => <a onClick={() => navigate(`/warehouses/${record.id}`)}>{text}</a> },
    { title: 'Адрес', dataIndex: 'address', key: 'address', responsive: ['sm'] },
    { title: 'Описание', dataIndex: 'description', key: 'description', responsive: ['md'] },
    {
      title: '',
      key: 'actions',
      render: (_: any, record: Warehouse) => (
        <Space>
          <Button type="link" onClick={() => { setEditing(record); form.setFieldsValue(record); setModalVisible(true) }}>Ред.</Button>
          <Button type="link" danger onClick={() => handleDelete(record.id)}>Удалить</Button>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalVisible(true) }}>
            Добавить склад
          </Button>
        </Col>
      </Row>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        scroll={{ x: true }}
        size={isMobile ? 'small' : 'middle'}
      />
      <Modal
        title={editing ? 'Редактировать склад' : 'Новый склад'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Название" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Адрес">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Описание">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default WarehouseList
