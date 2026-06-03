import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import api from '../services/api'
import { ENDPOINTS } from '../constants/api'
import { registrarNotificaciones } from '../services/notificaciones'

const useAuthStore = create((set) => ({
  usuario: null,
  token: null,
  cargando: false,

  login: async (email, password) => {
    set({ cargando: true })
    try {
      const { data } = await api.post(ENDPOINTS.LOGIN, { email, password })
      await SecureStore.setItemAsync('token', data.data.token)
      await SecureStore.setItemAsync('usuario', JSON.stringify(data.data.usuario))
      set({ usuario: data.data.usuario, token: data.data.token })
      registrarNotificaciones()
      return { ok: true }
    } catch (e) {
      return { ok: false, mensaje: e.response?.data?.mensaje || 'Error al iniciar sesión' }
    } finally {
      set({ cargando: false })
    }
  },

  registro: async (datos) => {
    set({ cargando: true })
    try {
      const { data } = await api.post(ENDPOINTS.REGISTRO, datos)
      await SecureStore.setItemAsync('token', data.data.token)
      await SecureStore.setItemAsync('usuario', JSON.stringify(data.data.usuario))
      set({ usuario: data.data.usuario, token: data.data.token })
      registrarNotificaciones()
      return { ok: true }
    } catch (e) {
      return { ok: false, mensaje: e.response?.data?.mensaje || 'Error al registrarse' }
    } finally {
      set({ cargando: false })
    }
  },

  // En authStore.js
  logout: async () => {
    try {
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('usuario');
      set({ usuario: null, token: null }); // Esto dispara la actualización en toda la app
    } catch (e) {
      console.error("Error al cerrar sesión:", e);
    }
  },

  cargarSesion: async () => {
    try {
      const token = await SecureStore.getItemAsync('token')
      const usuarioStr = await SecureStore.getItemAsync('usuario')

      if (!token || !usuarioStr) return

      const usuario = JSON.parse(usuarioStr)
      set({ token, usuario })
    } catch {
      // Si algo falla limpiamos la sesión
      await SecureStore.deleteItemAsync('token')
      await SecureStore.deleteItemAsync('usuario')
    }
  },
}))

export default useAuthStore