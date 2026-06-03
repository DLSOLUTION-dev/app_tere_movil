import { useEffect, useState } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import useAuthStore from '../store/authStore'

export default function Index() {
  const router = useRouter()
  const usuario = useAuthStore((s) => s.usuario)
  const token = useAuthStore((s) => s.token)
  const cargarSesion = useAuthStore((s) => s.cargarSesion)
  const [listo, setListo] = useState(false)

  useEffect(() => {
    cargarSesion().finally(() => setListo(true))
  }, [])

  useEffect(() => {
    if (!listo) return

    if (!token) {
      router.replace('/(auth)/login')
    } else if (usuario?.rol === 'ADMIN') {
      router.replace('/(admin)/dashboard')
    } else if (usuario?.rol === 'CLIENTE') {
      router.replace('/(client)/salon')
    } else {
      router.replace('/(auth)/login')
    }
  }, [listo, token, usuario])

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator size="large" color="#1a1a2e" />
    </View>
  )
}