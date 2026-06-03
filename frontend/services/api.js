import axios from 'axios'
import * as SecureStore from 'expo-secure-store'
import { API_URL } from '../constants/api'

const api = axios.create({ baseURL: API_URL })

// Adjunta el token JWT automáticamente a cada request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Manejo global de errores 401 (token expirado)
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      // Importación diferida para evitar dependencia circular
      const { default: useAuthStore } = await import('../store/authStore')
      await useAuthStore.getState().logout()
    }
    return Promise.reject(err)
  }
)

export default api
