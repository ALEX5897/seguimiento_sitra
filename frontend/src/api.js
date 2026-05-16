import axios from 'axios'
import router from './router'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  withCredentials: true // Enviar cookies/sesión con cada request
})

let isRedirecting = false

// Interceptor para errores 401
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 && !isRedirecting) {
      isRedirecting = true
      console.warn('🔐 Sesión expirada - redirigiendo a login')

      // Redirigir a login después de un pequeño delay
      setTimeout(() => {
        router.push('/login').finally(() => {
          isRedirecting = false
        })
      }, 500)
    }
    return Promise.reject(error)
  }
)

export default api
