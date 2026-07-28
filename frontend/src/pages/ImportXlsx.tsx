import { useState } from 'react'
import { Alert, Button, Card, List, Typography, Upload, message } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import type { RcFile } from 'antd/es/upload'
import { api } from '../api/client'

interface ImportResult {
  imported: number
  skipped: number
  created_locations: number
  errors: string[]
}

const ImportXlsx: React.FC = () => {
  const [file, setFile] = useState<RcFile | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const importFile = async () => {
    if (!file) {
      message.error('Выберите файл Excel')
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await api.post('/api/import/xlsx', formData)
      setResult(response.data)
      message.success(`Импортировано позиций: ${response.data.imported}`)
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Не удалось импортировать файл')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Typography.Title level={2}>Импорт из Excel</Typography.Title>
      <Card>
        <Alert
          type="info"
          showIcon
          message="Поддерживаемые форматы"
          description="Принтеры: S/N, ИНВ, НАХОЖДЕНИЕ. Компьютеры: Наименование, Название/Фамилия, Домен, Серийный номер (S/N), Инвентарный номер, Расположение, Комментарии. Аудитории из расположения будут созданы автоматически."
          style={{ marginBottom: 16 }}
        />
        <Upload.Dragger
          accept=".xlsx"
          maxCount={1}
          beforeUpload={selectedFile => {
            setFile(selectedFile)
            setResult(null)
            return false
          }}
          onRemove={() => setFile(null)}
          fileList={file ? [{ uid: file.uid, name: file.name, status: 'done' }] : []}
        >
          <p className="ant-upload-drag-icon"><InboxOutlined /></p>
          <p className="ant-upload-text">Перетащите .xlsx-файл или выберите его</p>
          <p className="ant-upload-hint">Дубликаты по S/N, инвентарному номеру или штрихкоду будут пропущены.</p>
        </Upload.Dragger>
        <Button type="primary" onClick={importFile} loading={loading} disabled={!file} style={{ marginTop: 16 }}>
          Импортировать
        </Button>
      </Card>
      {result && (
        <Card title="Результат импорта" style={{ marginTop: 16 }}>
          <Typography.Paragraph>Добавлено: {result.imported}; пропущено: {result.skipped}; создано аудиторий/складов: {result.created_locations}.</Typography.Paragraph>
          {result.errors.length > 0 && <List size="small" bordered dataSource={result.errors} renderItem={error => <List.Item>{error}</List.Item>} />}
        </Card>
      )}
    </div>
  )
}

export default ImportXlsx