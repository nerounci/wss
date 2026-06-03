import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, Table, Typography, Descriptions, Grid } from 'antd'
import { api } from '../api/client'

const WarehouseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [warehouse, setWarehouse] = useState<any>(null)
  const [equipment, setEquipment] = useState<any[]>([])
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md

  useEffect(() => {
    if (id) {
      api.get(`/api/warehouses/${id}`).then(res => setWarehouse(res.data))
      api.get(`/api/warehouses/${id}/equipment`).then(res => setEquipment(res.data))
    }
  }, [id])

  if (!warehouse) return <div>Загрузка...</div>

  return (
    <div>
      <Typography.Title level={isMobile ? 3 : 2}>{warehouse.name}</Typography.Title>
      <Descriptions bordered column={isMobile ? 1 : 2}>
        <Descriptions.Item label="Адрес">{warehouse.address}</Descriptions.Item>
        <Descriptions.Item label="Описание">{warehouse.description}</Descriptions.Item>
      </Descriptions>
      <Card title="Оборудование на складе" style={{ marginTop: 16 }}>
        <Table
          dataSource={equipment}
          rowKey="id"
          scroll={{ x: true }}
          size={isMobile ? 'small' : 'middle'}
          columns={[
            { title: 'Штрихкод', dataIndex: 'barcode', responsive: ['sm'] },
            { title: 'Наименование', dataIndex: 'name' },
            { title: 'Статус', dataIndex: 'current_status' }
          ]}
        />
      </Card>
    </div>
  )
}

export default WarehouseDetail
