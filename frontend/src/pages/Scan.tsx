
import { useState, useEffect, useRef } from 'react'
import { Card, Input, Button, Typography, Space, message, Descriptions, Tag } from 'antd'
import { SearchOutlined, CameraOutlined } from '@ant-design/icons'
import { Html5Qrcode } from 'html5-qrcode'
import { api } from '../api/client'
import { useNavigate } from 'react-router-dom'

const Scan: React.FC = () => {
  const [barcode, setBarcode] = useState('')
  const [scannedEquipment, setScannedEquipment] = useState<any>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const inputRef = useRef<any>(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Фокус на поле ввода для USB сканера
    if (!cameraActive) {
      inputRef.current?.focus()
    }
  }, [cameraActive])

  const searchByBarcode = async (code: string) => {
    try {
      const res = await api.get('/api/equipment/', { params: { barcode: code } })
      if (res.data.length > 0) {
        setScannedEquipment(res.data[0])
        message.success(`Найдено: ${res.data[0].name}`)
      } else {
        setScannedEquipment(null)
        message.warning('Оборудование не найдено')
      }
    } catch {
      message.error('Ошибка поиска')
    }
  }

  const handleBarcodeSubmit = (value: string) => {
    if (value.trim()) {
      searchByBarcode(value.trim())
      setBarcode('')
    }
  }

  const startCamera = async () => {
    setCameraActive(true)
    const elementId = "qr-reader"
    if (!document.getElementById(elementId)) {
      const div = document.createElement('div')
      div.id = elementId
      document.getElementById('camera-container')?.appendChild(div)
    }
    scannerRef.current = new Html5Qrcode(elementId)
    try {
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          handleBarcodeSubmit(decodedText)
          stopCamera()
        },
        () => {}
      )
    } catch (err) {
      message.error('Ошибка доступа к камере')
      setCameraActive(false)
    }
  }

  const stopCamera = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().then(() => {
        scannerRef.current?.clear()
        const el = document.getElementById('qr-reader')
        if (el) el.remove()
      }).catch(console.error)
      scannerRef.current = null
    }
    setCameraActive(false)
  }

  useEffect(() => {
    return () => { stopCamera() }
  }, [])

  return (
    <div>
      <Card title="Сканирование штрихкода / QR-кода">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input.Search
            ref={inputRef}
            placeholder="Отсканируйте штрихкод (USB-сканер) или введите вручную"
            value={barcode}
            onChange={e => setBarcode(e.target.value)}
            onSearch={handleBarcodeSubmit}
            enterButton={<SearchOutlined />}
            size="large"
            disabled={cameraActive}
          />
          <Button
            icon={<CameraOutlined />}
            onClick={cameraActive ? stopCamera : startCamera}
            type={cameraActive ? 'default' : 'primary'}
          >
            {cameraActive ? 'Остановить камеру' : 'Сканировать камерой'}
          </Button>
          <div id="camera-container"></div>
        </Space>
      </Card>

      {scannedEquipment && (
        <Card title="Результат сканирования" style={{ marginTop: 16 }}>
          <Descriptions bordered>
            <Descriptions.Item label="Название">{scannedEquipment.name}</Descriptions.Item>
            <Descriptions.Item label="Штрихкод">{scannedEquipment.barcode}</Descriptions.Item>
            <Descriptions.Item label="Категория">{scannedEquipment.category}</Descriptions.Item>
            <Descriptions.Item label="Статус">
              <Tag color={scannedEquipment.current_status === 'Рабочий' ? 'green' : 'blue'}>
                {scannedEquipment.current_status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Склад">{scannedEquipment.warehouse?.name || '-'}</Descriptions.Item>
          </Descriptions>
          <Button type="primary" style={{ marginTop: 16 }} onClick={() => navigate(`/equipment/${scannedEquipment.id}`)}>
            Открыть карточку
          </Button>
        </Card>
      )}
    </div>
  )
}

export default Scan