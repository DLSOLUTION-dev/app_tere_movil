import { useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert
} from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import api from '../../services/api'
import useAuthStore from '../../store/authStore'
import { ESTADO_CITA_LABEL, ESTADO_CITA_COLOR } from '../../types'
import LoadingScreen from '../../components/shared/LoadingScreen'

export default function InicioCliente() {
  const router = useRouter()
  const usuario = useAuthStore((s) => s.usuario)
  const logout = useAuthStore((s) => s.logout)

  const [citas, setCitas] = useState([])
  const [cargando, setCargando] = useState(true)

  useFocusEffect(
    useCallback(() => {
      cargarCitas()
    }, [])
  )

  const cargarCitas = async () => {
    try {
      const { data } = await api.get('/citas')
      setCitas(data.data)
    } catch {
      Alert.alert('Error', 'No se pudieron cargar las citas')
    } finally {
      setCargando(false)
    }
  }

  const cancelarCita = (cita) => {
    // Verificar horas restantes en el frontend también
    const horasRestantes = (new Date(cita.fechaHora) - new Date()) / 36e5

    if (horasRestantes < 3) {
      return Alert.alert(
        'No se puede cancelar',
        'Solo puedes cancelar con al menos 3 horas de anticipación'
      )
    }

    Alert.alert(
      '¿Cancelar cita?',
      `¿Seguro que quieres cancelar tu cita de ${cita.servicio?.nombre}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/citas/${cita.id}`)
              await cargarCitas()
              Alert.alert(
                'Cita cancelada',
                '¿Deseas reagendar para otra fecha?',
                [
                  { text: 'Ahora no', style: 'cancel' },
                  {
                    text: 'Reagendar',
                    onPress: () => router.push('/(client)/nueva-cita')
                  }
                ]
              )
            } catch (e) {
              Alert.alert('Error', e.response?.data?.mensaje || 'No se pudo cancelar la cita')
            }
          }
        }
      ]
    )
  }

  const puedeCancelar = (cita) => {
    if (!['PENDIENTE', 'APROBADA'].includes(cita.estado)) return false
    const horasRestantes = (new Date(cita.fechaHora) - new Date()) / 36e5
    return horasRestantes >= 3
  }

  const renderCita = ({ item }) => (
    <View style={styles.citaCard}>
      <View style={styles.citaHeader}>
        <Text style={styles.servicio}>{item.servicio?.nombre}</Text>
        <View style={[styles.badge, { backgroundColor: ESTADO_CITA_COLOR[item.estado] + '20' }]}>
          <Text style={[styles.badgeTexto, { color: ESTADO_CITA_COLOR[item.estado] }]}>
            {ESTADO_CITA_LABEL[item.estado]}
          </Text>
        </View>
      </View>

      <View style={styles.citaDetalle}>
        <Ionicons name="calendar-outline" size={14} color="#aaa" />
        <Text style={styles.fecha}>
          {new Date(item.fechaHora).toLocaleString('es-EC', {
            dateStyle: 'medium', timeStyle: 'short'
          })}
        </Text>
      </View>

      {item.servicio?.duracionMin && (
        <View style={styles.citaDetalle}>
          <Ionicons name="time-outline" size={14} color="#aaa" />
          <Text style={styles.fecha}>{item.servicio.duracionMin} minutos</Text>
        </View>
      )}

      {/* Botón cancelar solo si aplica */}
      {puedeCancelar(item) && (
        <TouchableOpacity
          style={styles.btnCancelar}
          onPress={() => cancelarCita(item)}
        >
          <Ionicons name="close-circle-outline" size={16} color="#ef4444" />
          <Text style={styles.btnCancelarTexto}>Cancelar cita</Text>
        </TouchableOpacity>
      )}

      {/* Mensaje si ya no puede cancelar */}
      {['PENDIENTE', 'APROBADA'].includes(item.estado) && !puedeCancelar(item) && (
        <Text style={styles.noCancelarTexto}>
          ⚠️ Ya no se puede cancelar — faltan menos de 3 horas
        </Text>
      )}
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.bienvenida}>Hola, {usuario?.nombre} 👋</Text>
          <Text style={styles.subtitulo}>Tus citas activas</Text>
        </View>
        <View style={styles.headerAcciones}>
          <TouchableOpacity onPress={cargarCitas} style={styles.headerBtn}>
            <Ionicons name="refresh" size={20} color="#888" />
          </TouchableOpacity>
          <TouchableOpacity onPress={async () => {
            await logout()
            router.replace('/(auth)/login')
          }}>
            <Ionicons name="log-out-outline" size={22} color="#888" />
          </TouchableOpacity>
        </View>
      </View>

      {cargando
        ? <LoadingScreen />
        : <FlatList
          data={citas.filter(c => !['COMPLETADA', 'CANCELADA', 'RECHAZADA'].includes(c.estado))}
          keyExtractor={(i) => i.id}
          renderItem={renderCita}
          ListEmptyComponent={
            <View style={styles.vacio}>
              <Ionicons name="calendar-outline" size={48} color="#ddd" />
              <Text style={styles.vacioTexto}>No tienes citas activas</Text>
              <Text style={styles.vacioSub}>Agenda una nueva cita desde abajo</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      }

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(client)/nueva-cita')}
      >
        <Ionicons name="add" size={22} color="#fff" />
        <Text style={styles.fabTexto}>Nueva cita</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f3ef' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 60, backgroundColor: '#fff' },
  bienvenida: { fontSize: 22, fontWeight: '700', color: '#1a1a2e' },
  subtitulo: { fontSize: 14, color: '#888', marginTop: 2 },
  headerAcciones: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  headerBtn: { padding: 4 },
  citaCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, margin: 12, marginBottom: 0 },
  citaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  servicio: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', flex: 1 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeTexto: { fontSize: 12, fontWeight: '600' },
  citaDetalle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  fecha: { fontSize: 13, color: '#666' },
  btnCancelar: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: '#fee2e2', borderRadius: 8, padding: 10, justifyContent: 'center' },
  btnCancelarTexto: { color: '#ef4444', fontWeight: '700', fontSize: 13 },
  noCancelarTexto: { fontSize: 12, color: '#f59e0b', marginTop: 10, textAlign: 'center' },
  vacio: { alignItems: 'center', marginTop: 80, gap: 10 },
  vacioTexto: { fontSize: 16, fontWeight: '600', color: '#aaa' },
  vacioSub: { fontSize: 13, color: '#ccc' },
  fab: { position: 'absolute', bottom: 32, right: 24, backgroundColor: '#1a1a2e', borderRadius: 30, paddingVertical: 14, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 8 },
  fabTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
})