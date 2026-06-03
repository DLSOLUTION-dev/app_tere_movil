import { useEffect, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Platform
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import api from '../../services/api'

const HORARIOS_DEFAULT = {
  diasTrabajo: [2, 3, 4, 5, 6],
  manaInicio: '09:00', manaFin: '13:00',
  tardeInicio: '15:00', tardeFin: '19:00',
}

const generarSlots = (inicio, fin) => {
  const slots = []
  const [hI, mI] = inicio.split(':').map(Number)
  const [hF, mF] = fin.split(':').map(Number)
  let mins = hI * 60 + mI
  const finMins = hF * 60 + mF
  while (mins < finMins) {
    slots.push(`${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`)
    mins += 30
  }
  return slots
}

export default function NuevaCita() {
  const router = useRouter()

  const [servicios, setServicios] = useState([])
  const [servicioId, setServicioId] = useState(null)
  const [fecha, setFecha] = useState(new Date())
  const [horaSeleccionada, setHoraSeleccionada] = useState(null)
  const [mostrarCalendario, setMostrarCalendario] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [horasOcupadas, setHorasOcupadas] = useState([])
  const [cargandoHoras, setCargandoHoras] = useState(false)
  const [config, setConfig] = useState(HORARIOS_DEFAULT)

  useEffect(() => {
    api.get('/servicios').then(({ data }) => setServicios(data.data))
    api.get('/info-salon')
      .then(({ data }) => { if (data.data?.horarios) setConfig({ ...HORARIOS_DEFAULT, ...data.data.horarios }) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (fecha) cargarHorasOcupadas()
  }, [fecha, servicioId])

  const cargarHorasOcupadas = async () => {
    setCargandoHoras(true)
    try {
      const fechaStr = fecha.toISOString().split('T')[0]
      const params = servicioId
        ? `fecha=${fechaStr}&servicioId=${servicioId}`
        : `fecha=${fechaStr}`
      const { data } = await api.get(`/citas/horas-ocupadas?${params}`)
      setHorasOcupadas(data.data || [])
    } catch {
      setHorasOcupadas([])
    } finally {
      setCargandoHoras(false)
    }
  }

  const horasManana = generarSlots(config.manaInicio, config.manaFin)
  const horasTarde  = generarSlots(config.tardeInicio, config.tardeFin)

  const esDiaNormal = () => config.diasTrabajo.includes(fecha.getDay())

  const esHoraNormal = (hora) => [...horasManana, ...horasTarde].includes(hora)

  const estaOcupada = (hora) => horasOcupadas.includes(hora)

  const onCambioFecha = (event, fechaElegida) => {
    setMostrarCalendario(Platform.OS === 'ios')
    if (fechaElegida) {
      setFecha(fechaElegida)
      setHoraSeleccionada(null)
    }
  }

  const mensajeDiaNoLaboral = () => {
    const dia = fecha.getDay()
    if (dia === 0) return 'Los domingos no se trabaja normalmente. Teresa decidirá si aprueba tu cita.'
    if (dia === 1) return 'Los lunes no se trabaja normalmente. Teresa decidirá si aprueba tu cita.'
    return 'Este día no se trabaja normalmente. Teresa decidirá si aprueba tu cita.'
  }

  const seleccionarHora = (hora) => {
    if (estaOcupada(hora)) return

    const esNormal = esDiaNormal() && esHoraNormal(hora)

    if (!esNormal) {
      const mensaje = !esDiaNormal()
        ? mensajeDiaNoLaboral()
        : 'Este horario está fuera del horario normal. Teresa decidirá si aprueba tu cita.'

      Alert.alert('⚠️ Horario especial', mensaje, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Agendar igual', onPress: () => setHoraSeleccionada(hora) }
      ])
      return
    }

    setHoraSeleccionada(hora)
  }

  const handleAgendar = async () => {
    if (!servicioId) return Alert.alert('Error', 'Selecciona un servicio')
    if (!horaSeleccionada) return Alert.alert('Error', 'Selecciona una hora')

    const [horas, minutos] = horaSeleccionada.split(':').map(Number)
    const fechaHora = new Date(fecha)
    fechaHora.setHours(horas, minutos, 0, 0)

    if (fechaHora < new Date()) {
      return Alert.alert('Error', 'No puedes agendar en una fecha pasada')
    }

    setCargando(true)
    try {
      await api.post('/citas', {
        servicioId,
        fechaHora: fechaHora.toISOString(),
      })
      Alert.alert('¡Listo!', 'Tu cita fue enviada. Espera confirmación de Teresa.')
      router.back()
    } catch (e) {
      Alert.alert('Error', e.response?.data?.mensaje || 'No se pudo agendar')
    } finally {
      setCargando(false)
    }
  }

  const formatearFecha = (d) => d.toLocaleDateString('es-EC', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={22} color="#7c6ef7" />
        <Text style={styles.backTexto}>Volver</Text>
      </TouchableOpacity>

      <Text style={styles.titulo}>Nueva cita</Text>

      {/* Advertencia día no laboral */}
      {!esDiaNormal() && (
        <View style={styles.advertencia}>
          <Ionicons name="warning-outline" size={18} color="#d97706" />
          <Text style={styles.advertenciaTexto}>
            {mensajeDiaNoLaboral()}
          </Text>
        </View>
      )}

      {/* Selector de servicio */}
      <Text style={styles.label}>Servicio</Text>
      {servicios.map((s) => (
        <TouchableOpacity
          key={s.id}
          style={[styles.opcion, servicioId === s.id && styles.opcionActiva]}
          onPress={() => { setServicioId(s.id); setHoraSeleccionada(null) }}
        >
          <Text style={[styles.opcionTexto, servicioId === s.id && { fontWeight: '700' }]}>
            {s.nombre}
          </Text>
          <Text style={styles.duracion}>⏱ {s.duracionMin} min</Text>
        </TouchableOpacity>
      ))}

      {/* Selector de fecha */}
      <Text style={styles.label}>Fecha</Text>
      <TouchableOpacity
        style={styles.fechaBtn}
        onPress={() => setMostrarCalendario(true)}
      >
        <Ionicons name="calendar-outline" size={20} color="#1a1a2e" />
        <Text style={styles.fechaBtnTexto}>{formatearFecha(fecha)}</Text>
      </TouchableOpacity>

      {mostrarCalendario && (
        <DateTimePicker
          value={fecha}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date()}
          onChange={onCambioFecha}
          locale="es-EC"
        />
      )}

      {/* Slots de hora */}
      <Text style={styles.label}>Hora disponible</Text>

      {cargandoHoras ? (
        <Text style={styles.cargandoTexto}>Cargando horarios...</Text>
      ) : (
        <>
          {/* Horario normal */}
          <Text style={styles.turnoLabel}>🌅 Mañana ({config.manaInicio} - {config.manaFin})</Text>
          <View style={styles.slotsGrid}>
            {horasManana.map((hora) => (
              <TouchableOpacity
                key={hora}
                style={[
                  styles.slot,
                  horaSeleccionada === hora && styles.slotActivo,
                  estaOcupada(hora) && styles.slotOcupado,
                ]}
                onPress={() => seleccionarHora(hora)}
                disabled={estaOcupada(hora)}
              >
                <Text style={[
                  styles.slotTexto,
                  horaSeleccionada === hora && styles.slotTextoActivo,
                  estaOcupada(hora) && styles.slotTextoOcupado,
                ]}>
                  {hora}
                </Text>
                {estaOcupada(hora) && (
                  <Text style={styles.slotOcupadoLabel}>Ocupado</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.turnoLabel}>🌆 Tarde ({config.tardeInicio} - {config.tardeFin})</Text>
          <View style={styles.slotsGrid}>
            {horasTarde.map((hora) => (
              <TouchableOpacity
                key={hora}
                style={[
                  styles.slot,
                  horaSeleccionada === hora && styles.slotActivo,
                  estaOcupada(hora) && styles.slotOcupado,
                ]}
                onPress={() => seleccionarHora(hora)}
                disabled={estaOcupada(hora)}
              >
                <Text style={[
                  styles.slotTexto,
                  horaSeleccionada === hora && styles.slotTextoActivo,
                  estaOcupada(hora) && styles.slotTextoOcupado,
                ]}>
                  {hora}
                </Text>
                {estaOcupada(hora) && (
                  <Text style={styles.slotOcupadoLabel}>Ocupado</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Horarios especiales */}
          <TouchableOpacity
            style={styles.horarioEspecialBtn}
            onPress={() => {
              Alert.alert(
                'Horario especial',
                'Selecciona una hora fuera del horario normal. Teresa decidirá si la aprueba.',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  ...['07:00', '07:30', '08:00', '08:30', '13:00', '13:30', '14:00', '14:30', '19:00', '19:30']
                    .filter(h => !estaOcupada(h))
                    .map(h => ({
                      text: h,
                      onPress: () => {
                        Alert.alert(
                          '⚠️ Horario especial',
                          `Las ${h} está fuera del horario normal. Teresa decidirá si aprueba tu cita.`,
                          [
                            { text: 'Cancelar', style: 'cancel' },
                            { text: 'Agendar igual', onPress: () => setHoraSeleccionada(h) }
                          ]
                        )
                      }
                    }))
                ]
              )
            }}
          >
            <Ionicons name="time-outline" size={16} color="#7c6ef7" />
            <Text style={styles.horarioEspecialTexto}>Solicitar horario especial</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Resumen */}
      {horaSeleccionada && (
        <View style={styles.resumen}>
          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          <Text style={styles.resumenTexto}>
            {formatearFecha(fecha)} a las {horaSeleccionada}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.boton, (!servicioId || !horaSeleccionada || cargando) && { opacity: 0.5 }]}
        onPress={handleAgendar}
        disabled={!servicioId || !horaSeleccionada || cargando}
      >
        <Text style={styles.botonTexto}>
          {cargando ? 'Enviando...' : 'Solicitar cita'}
        </Text>
      </TouchableOpacity>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f3ef', padding: 24 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 48, marginBottom: 8 },
  backTexto: { color: '#7c6ef7', fontSize: 15 },
  titulo: { fontSize: 26, fontWeight: '700', color: '#1a1a2e', marginBottom: 24 },
  advertencia: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#fef3c7', borderRadius: 10, padding: 12, marginBottom: 16 },
  advertenciaTexto: { fontSize: 13, color: '#92400e', flex: 1 },
  label: { fontSize: 13, fontWeight: '600', color: '#888', marginBottom: 8, marginTop: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  opcion: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1.5, borderColor: 'transparent' },
  opcionActiva: { borderColor: '#1a1a2e', backgroundColor: '#1a1a2e10' },
  opcionTexto: { fontSize: 15, color: '#1a1a2e' },
  duracion: { fontSize: 13, color: '#888' },
  fechaBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#e5e7eb' },
  fechaBtnTexto: { fontSize: 15, color: '#1a1a2e', textTransform: 'capitalize' },
  turnoLabel: { fontSize: 13, fontWeight: '600', color: '#1a1a2e', marginTop: 12, marginBottom: 8 },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slot: { backgroundColor: '#fff', borderRadius: 10, padding: 12, minWidth: 80, alignItems: 'center', borderWidth: 1.5, borderColor: '#e5e7eb' },
  slotActivo: { backgroundColor: '#1a1a2e', borderColor: '#1a1a2e' },
  slotOcupado: { backgroundColor: '#f4f3ef', borderColor: '#e5e7eb', opacity: 0.5 },
  slotTexto: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  slotTextoActivo: { color: '#fff' },
  slotTextoOcupado: { color: '#aaa' },
  slotOcupadoLabel: { fontSize: 9, color: '#aaa', marginTop: 2 },
  horarioEspecialBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#7c6ef7', borderStyle: 'dashed', justifyContent: 'center' },
  horarioEspecialTexto: { color: '#7c6ef7', fontWeight: '600', fontSize: 13 },
  resumen: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#d1fae5', borderRadius: 10, padding: 14, marginTop: 20 },
  resumenTexto: { fontSize: 14, fontWeight: '600', color: '#065f46', textTransform: 'capitalize' },
  boton: { backgroundColor: '#1a1a2e', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 20, marginBottom: 40 },
  botonTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cargandoTexto: { color: '#aaa', textAlign: 'center', marginTop: 20 },
}) 