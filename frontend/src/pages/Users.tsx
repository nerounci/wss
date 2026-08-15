import { useEffect, useState } from 'react'
import { Table, Grid, Tag, Button, Modal, Form, Input, Select, Switch, Divider, Typography, message } from 'antd'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

interface Role {
  id: number
  name: string
}

interface UserRow {
  id: number
  username: string
  full_name?: string
  role_id: number
  role: Role
}

const roleLabel = (name: string) => name === 'owner' ? 'Владелец' : name === 'admin' ? 'Администратор' : 'Сотрудник'
const roleColor = (name: string) => name === 'owner' ? 'gold' : name === 'admin' ? 'red' : 'blue'

const PAGE_LABELS: Record<string, string> = {
  dashboard: 'Дашборд',
  equipment: 'Оборудование',
  technology: 'Техника',
  warehouses: 'Склады и аудитории',
  movements: 'Перемещения',
  relocation: 'Перестановка',
  scan: 'Сканер',
  import: 'Импорт Excel',
  logs: 'Журнал',
  users: 'Пользователи',
}

const Users: React.FC = () => {
  const [data, setData] = useState<UserRow[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<UserRow | null>(null)
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})
  const [permissionsLoading, setPermissionsLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()
  const { isOwner } = useAuth()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md

  const load = async () => {
    setLoading(true)
    try {
      const [usersRes, rolesRes] = await Promise.all([api.get('/api/users'), api.get('/api/roles')])
      setData(usersRes.data)
      setRoles(rolesRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openEdit = async (record: UserRow) => {
    setEditing(record)
    form.setFieldsValue({ full_name: record.full_name, role_id: record.role_id })
    setModalVisible(true)
    if (isOwner) {
      setPermissionsLoading(true)
      try {
        const res = await api.get(`/api/users/${record.id}/permissions`)
        setPermissions(res.data)
      } finally {
        setPermissionsLoading(false)
      }
    }
  }

  const handleSave = async () => {
    if (!editing) return
    const values = await form.validateFields()
    try {
      await api.put(`/api/users/${editing.id}`, values)
      message.success('Пользователь обновлён')
      setModalVisible(false)
      setEditing(null)
      load()
    } catch (err: any) {
      message.error(err.response?.data?.detail || 'Не удалось сохранить')
    }
  }

  const togglePermission = async (pageKey: string, allowed: boolean) => {
    if (!editing) return
    setPermissions(prev => ({ ...prev, [pageKey]: allowed }))
    try {
      await api.put(`/api/users/${editing.id}/permissions/${pageKey}`, { allowed })
    } catch (err: any) {
      message.error(err.response?.data?.detail || 'Не удалось изменить права')
      setPermissions(prev => ({ ...prev, [pageKey]: !allowed }))
    }
  }

  const roleOptions = roles
    .filter(r => isOwner || r.name !== 'owner')
    .map(r => ({ value: r.id, label: roleLabel(r.name) }))

  const columns = [
    { title: 'ID', dataIndex: 'id', responsive: ['md'] },
    { title: 'Логин', dataIndex: 'username' },
    { title: 'Имя', dataIndex: 'full_name', responsive: ['sm'] },
    {
      title: 'Роль',
      dataIndex: ['role', 'name'],
      render: (role: string) => <Tag color={roleColor(role)}>{roleLabel(role)}</Tag>,
    },
    {
      title: '',
      key: 'actions',
      render: (_: any, record: UserRow) => (
        <Button type="text" onClick={() => openEdit(record)} title="Редактировать">🖉</Button>
      ),
    },
  ]

  return (
    <div>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} scroll={{ x: true }} size={isMobile ? 'small' : 'middle'} />
      <Modal
        title="Редактировать пользователя"
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => { setModalVisible(false); setEditing(null) }}
        width={isOwner ? 520 : undefined}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="full_name" label="Имя">
            <Input />
          </Form.Item>
          <Form.Item name="role_id" label="Роль" rules={[{ required: true }]}>
            <Select options={roleOptions} />
          </Form.Item>
        </Form>
        {isOwner && editing && (
          <>
            <Divider />
            <Typography.Text strong>Доступ к разделам</Typography.Text>
            <Typography.Paragraph type="secondary" style={{ marginTop: 4 }}>
              Можно вручную открыть или закрыть доступ к конкретным страницам — независимо от роли.
            </Typography.Paragraph>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, opacity: permissionsLoading ? 0.5 : 1 }}>
              {Object.entries(PAGE_LABELS).map(([key, label]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 200 }}>
                  <Switch
                    size="small"
                    checked={permissions[key] ?? false}
                    disabled={permissionsLoading}
                    onChange={(checked) => togglePermission(key, checked)}
                  />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}

export default Users
