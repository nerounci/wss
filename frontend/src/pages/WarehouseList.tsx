import { useEffect, useState } from 'react'
import { Button, Table, Space, Modal, Input, Form, message, Row, Col, Grid, Popconfirm } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { api } from '../api/client'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
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
    try {
      await api.delete(`/api/warehouses/${id}`)
      message.success('Удалён')
      fetch()
    } catch (err: any) {
      message.error(err.response?.data?.detail || 'Не удалось удалить')
    }
  }

  const handleBulkDelete = async () => {
    try {
      const res = await api.delete('/api/warehouses/batch', { data: { ids: selectedIds } })
      const { deleted, errors } = res.data
      if (deleted) message.success(`Удалено: ${deleted}`)
      if (errors?.length) errors.forEach((e: string) => message.error(e))
      setSelectedIds([])
      fetch()
    } catch (err: any) {
      message.error(err.response?.data?.detail || 'Не удалось удалить выбранное')
    }
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
          <Button type="text" onClick={() => { setEditing(record); form.setFieldsValue(record); setModalVisible(true) }} title="Редактировать">🖉</Button>
          <Button type="link" danger onClick={() => handleDelete(record.id)}>Удалить</Button>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalVisible(true) }}>
              Добавить аудиторию / склад
            </Button>
            {isAdmin && selectedIds.length > 0 && (
              <Popconfirm title={`Удалить выбранные (${selectedIds.length})?`} onConfirm={handleBulkDelete} okText="Удалить" cancelText="Отмена">
                <Button danger>Удалить выбранное ({selectedIds.length})</Button>
              </Popconfirm>
            )}
          </Space>
        </Col>
      </Row>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        scroll={{ x: true }}
        size={isMobile ? 'small' : 'middle'}
        rowSelection={isAdmin ? { selectedRowKeys: selectedIds, onChange: keys => setSelectedIds(keys.map(Number)) } : undefined}
      />
      <Modal
        title={editing ? 'Редактировать аудиторию / склад' : 'Новая аудитория / склад'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Название аудитории или склада" rules={[{ required: true }]}>
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
