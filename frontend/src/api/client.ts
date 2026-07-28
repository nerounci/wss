import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // Axios сам установит boundary для FormData.
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
    return config
  }
  // Если данные — URLSearchParams, устанавливаем заголовок явно
  if (config.data instanceof URLSearchParams) {
    config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
  } else {
    config.headers['Content-Type'] = 'application/json'
  }
  return config
})
