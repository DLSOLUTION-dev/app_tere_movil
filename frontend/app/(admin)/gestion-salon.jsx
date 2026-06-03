import { useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, FlatList,
  TouchableOpacity, TextInput, Image, Alert,
  Modal, KeyboardAvoidingView, Platform, Keyboard
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import api from '../../services/api'
import { theme } from '../../constants/theme'
import { COLORS } from '../../constants/colors'
import LoadingScreen from '../../components/shared/LoadingScreen'

const TABS = ['Info salón', 'Horarios', 'Trabajos']
const FORM_VACIO = { id: null, titulo: '', descripcion: '', antesBase64: null, despuesBase64: null, antesUrl: null, despuesUrl: null }
const DIAS_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const HORARIOS_DEFAULT = { diasTrabajo: [2, 3, 4, 5, 6], manaInicio: '09:00', manaFin: '13:00', tardeInicio: '15:00', tardeFin: '19:00' }

export default function GestionSalon() {
  const [tabActiva, setTabActiva] = useState('Info salón')
  const [cargando, setCargando] = useState(true)

  const [info, setInfo] = useState({ vision: '', mision: '', contacto: '' })
  const [guardandoInfo, setGuardandoInfo] = useState(false)

  const [horarios, setHorarios] = useState(HORARIOS_DEFAULT)
  const [guardandoHorarios, setGuardandoHorarios] = useState(false)

  const [trabajos, setTrabajos] = useState([])
  const [modal, setModal] = useState(false)
  const [esEdicion, setEsEdicion] = useState(false)
  const [form, setForm] = useState(FORM_VACIO)
  const [guardandoTrabajo, setGuardandoTrabajo] = useState(false)

  useFocusEffect(useCallback(() => { cargarDatos() }, []))

  const cargarDatos = async () => {
    try {
      const [infoRes, trabajosRes] = await Promise.all([
        api.get('/info-salon'),
        api.get('/trabajos'),
      ])
      const i = infoRes.data.data
      setInfo({ vision: i.vision || '', mision: i.mision || '', contacto: i.contacto || '' })
      if (i.horarios) setHorarios({ ...HORARIOS_DEFAULT, ...i.horarios })
      setTrabajos(trabajosRes.data.data)
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los datos')
    } finally {
      setCargando(false)
    }
  }

  const guardarInfo = async () => {
    setGuardandoInfo(true)
    try {
      await api.put('/info-salon', info)
      Alert.alert('✅ Guardado', 'Información del salón actualizada')
    } catch {
      Alert.alert('Error', 'No se pudo guardar la información')
    } finally {
      setGuardandoInfo(false)
    }
  }

  const toggleDia = (idx) => {
    setHorarios((h) => ({
      ...h,
      diasTrabajo: h.diasTrabajo.includes(idx)
        ? h.diasTrabajo.filter((d) => d !== idx)
        : [...h.diasTrabajo, idx].sort(),
    }))
  }

  const validarHora = (v) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v)

  const guardarHorarios = async () => {
    const { manaInicio, manaFin, tardeInicio, tardeFin } = horarios
    if (![manaInicio, manaFin, tardeInicio, tardeFin].every(validarHora)) {
      return Alert.alert('Formato inválido', 'Las horas deben tener formato HH:MM (ej: 09:00)')
    }
    setGuardandoHorarios(true)
    try {
      await api.put('/info-salon', { horarios })
      Alert.alert('✅ Guardado', 'Horarios actualizados')
    } catch {
      Alert.alert('Error', 'No se pudo guardar los horarios')
    } finally {
      setGuardandoHorarios(false)
    }
  }

  const pickImage = async (tipo) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    })
    if (!result.canceled && result.assets[0].base64) {
      const campo = tipo === 'antes' ? 'antesBase64' : 'despuesBase64'
      setForm((f) => ({ ...f, [campo]: result.assets[0].base64 }))
    }
  }

  const abrirCrear = () => {
    setEsEdicion(false)
    setForm(FORM_VACIO)
    setModal(true)
  }

  const abrirEditar = (trabajo) => {
    setEsEdicion(true)
    setForm({
      id: trabajo.id,
      titulo: trabajo.titulo,
      descripcion: trabajo.descripcion || '',
      antesBase64: null,
      despuesBase64: null,
      antesUrl: trabajo.antesUrl,
      despuesUrl: trabajo.despuesUrl,
    })
    setModal(true)
  }

  const guardarTrabajo = async () => {
    if (!form.titulo.trim()) return Alert.alert('El título es requerido')
    if (!esEdicion && (!form.antesBase64 || !form.despuesBase64)) {
      return Alert.alert('Agrega ambas imágenes (antes y después)')
    }
    setGuardandoTrabajo(true)
    try {
      const payload = {
        titulo: form.titulo,
        descripcion: form.descripcion,
        ...(form.antesBase64   && { antesBase64:   form.antesBase64 }),
        ...(form.despuesBase64 && { despuesBase64: form.despuesBase64 }),
      }
      if (esEdicion) {
        await api.put(`/trabajos/${form.id}`, payload)
      } else {
        await api.post('/trabajos', payload)
      }
      setModal(false)
      await cargarDatos()
      Alert.alert('✅', esEdicion ? 'Trabajo actualizado' : 'Trabajo creado')
    } catch (e) {
      Alert.alert('Error', e.response?.data?.mensaje || 'No se pudo guardar')
    } finally {
      setGuardandoTrabajo(false)
    }
  }

  const eliminarTrabajo = (id) => {
    Alert.alert('¿Eliminar trabajo?', 'Esta acción no se puede deshacer', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/trabajos/${id}`)
            await cargarDatos()
          } catch {
            Alert.alert('Error', 'No se pudo eliminar')
          }
        },
      },
    ])
  }

  if (cargando) return <LoadingScreen />

  return (
    <View style={theme.container}>

      <View style={theme.header}>
        <Text style={theme.titulo}>Galería</Text>
        <TouchableOpacity onPress={cargarDatos}>
          <Ionicons name="refresh" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={theme.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[theme.tab, tabActiva === tab && theme.tabActiva]}
            onPress={() => setTabActiva(tab)}
          >
            <Text style={[theme.tabTexto, tabActiva === tab && theme.tabTextoActivo]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── TAB: INFO SALÓN ── */}
      {tabActiva === 'Info salón' && (
        <ScrollView contentContainerStyle={styles.contenido}>
          <Text style={theme.seccionTitulo}>Información pública del salón</Text>

          <Text style={theme.inputLabel}>Visión</Text>
          <TextInput
            style={[theme.input, styles.textarea]}
            placeholder="Nuestra visión es..."
            value={info.vision}
            onChangeText={(v) => setInfo((i) => ({ ...i, vision: v }))}
            multiline
          />

          <Text style={theme.inputLabel}>Misión</Text>
          <TextInput
            style={[theme.input, styles.textarea]}
            placeholder="Nuestra misión es..."
            value={info.mision}
            onChangeText={(v) => setInfo((i) => ({ ...i, mision: v }))}
            multiline
          />

          <Text style={theme.inputLabel}>Contacto</Text>
          <TextInput
            style={theme.input}
            placeholder="Teléfono, dirección, Instagram..."
            value={info.contacto}
            onChangeText={(v) => setInfo((i) => ({ ...i, contacto: v }))}
          />

          <TouchableOpacity
            style={[theme.btnPrimario, guardandoInfo && { opacity: 0.6 }]}
            onPress={guardarInfo}
            disabled={guardandoInfo}
          >
            <Text style={theme.btnPrimarioTexto}>
              {guardandoInfo ? 'Guardando...' : 'Guardar información'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── TAB: HORARIOS ── */}
      {tabActiva === 'Horarios' && (
        <ScrollView contentContainerStyle={styles.contenido}>
          <Text style={theme.seccionTitulo}>Días y horario de atención</Text>

          <Text style={theme.inputLabel}>Días de trabajo</Text>
          <View style={styles.diasRow}>
            {DIAS_LABELS.map((dia, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.diaBtn, horarios.diasTrabajo.includes(idx) && styles.diaBtnActivo]}
                onPress={() => toggleDia(idx)}
              >
                <Text style={[styles.diaBtnTexto, horarios.diasTrabajo.includes(idx) && styles.diaBtnTextoActivo]}>
                  {dia}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={theme.inputLabel}>Horario mañana</Text>
          <View style={styles.rangoRow}>
            <TextInput
              style={[theme.input, styles.rangoInput]}
              value={horarios.manaInicio}
              onChangeText={(v) => setHorarios((h) => ({ ...h, manaInicio: v }))}
              placeholder="09:00"
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
            <Text style={styles.rangoSep}>—</Text>
            <TextInput
              style={[theme.input, styles.rangoInput]}
              value={horarios.manaFin}
              onChangeText={(v) => setHorarios((h) => ({ ...h, manaFin: v }))}
              placeholder="13:00"
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
          </View>

          <Text style={theme.inputLabel}>Horario tarde</Text>
          <View style={styles.rangoRow}>
            <TextInput
              style={[theme.input, styles.rangoInput]}
              value={horarios.tardeInicio}
              onChangeText={(v) => setHorarios((h) => ({ ...h, tardeInicio: v }))}
              placeholder="15:00"
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
            <Text style={styles.rangoSep}>—</Text>
            <TextInput
              style={[theme.input, styles.rangoInput]}
              value={horarios.tardeFin}
              onChangeText={(v) => setHorarios((h) => ({ ...h, tardeFin: v }))}
              placeholder="19:00"
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
          </View>

          <TouchableOpacity
            style={[theme.btnPrimario, guardandoHorarios && { opacity: 0.6 }]}
            onPress={guardarHorarios}
            disabled={guardandoHorarios}
          >
            <Text style={theme.btnPrimarioTexto}>
              {guardandoHorarios ? 'Guardando...' : 'Guardar horarios'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── TAB: TRABAJOS ── */}
      {tabActiva === 'Trabajos' && (
        <View style={{ flex: 1 }}>
          <FlatList
            data={trabajos}
            keyExtractor={(i) => i.id}
            contentContainerStyle={styles.contenido}
            ListEmptyComponent={
              <Text style={theme.vacio}>
                No hay trabajos. Toca + para agregar el primero.
              </Text>
            }
            renderItem={({ item }) => (
              <View style={styles.trabajoCard}>
                <View style={styles.trabajoRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.trabajoTitulo}>{item.titulo}</Text>
                    {item.descripcion ? (
                      <Text style={styles.trabajoDesc}>{item.descripcion}</Text>
                    ) : null}
                  </View>
                  <View style={styles.acciones}>
                    <TouchableOpacity
                      style={styles.btnAccion}
                      onPress={() => abrirEditar(item)}
                    >
                      <Ionicons name="pencil" size={17} color={COLORS.secondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.btnAccion}
                      onPress={() => eliminarTrabajo(item.id)}
                    >
                      <Ionicons name="trash-outline" size={17} color={COLORS.danger} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.imagenesRow}>
                  <View style={styles.imagenBox}>
                    <Text style={styles.imagenLabel}>Antes</Text>
                    <Image
                      source={{ uri: item.antesUrl }}
                      style={styles.imagenMiniatura}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.imagenBox}>
                    <Text style={styles.imagenLabel}>Después</Text>
                    <Image
                      source={{ uri: item.despuesUrl }}
                      style={styles.imagenMiniatura}
                      resizeMode="cover"
                    />
                  </View>
                </View>
              </View>
            )}
          />

          <TouchableOpacity style={styles.fab} onPress={abrirCrear}>
            <Ionicons name="add" size={26} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Modal: crear / editar trabajo ── */}
      <Modal visible={modal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            style={theme.modalOverlay}
            activeOpacity={1}
            onPress={() => { Keyboard.dismiss(); setModal(false) }}
          >
            <ScrollView>
              <View style={theme.modal} onStartShouldSetResponder={() => true}>
                <Text style={theme.modalTitulo}>
                  {esEdicion ? 'Editar trabajo' : 'Nuevo trabajo'}
                </Text>

                <Text style={theme.inputLabel}>Título *</Text>
                <TextInput
                  style={theme.input}
                  placeholder="Ej: Coloración completa"
                  value={form.titulo}
                  onChangeText={(v) => setForm((f) => ({ ...f, titulo: v }))}
                />

                <Text style={theme.inputLabel}>Descripción</Text>
                <TextInput
                  style={[theme.input, styles.textarea]}
                  placeholder="Describe el trabajo realizado..."
                  value={form.descripcion}
                  onChangeText={(v) => setForm((f) => ({ ...f, descripcion: v }))}
                  multiline
                />

                <Text style={theme.inputLabel}>
                  Imagen "Antes" {!esEdicion && '*'}
                </Text>
                <TouchableOpacity
                  style={styles.pickerBtn}
                  onPress={() => pickImage('antes')}
                >
                  {(form.antesBase64 || form.antesUrl) ? (
                    <Image
                      source={{ uri: form.antesBase64 ? `data:image/jpeg;base64,${form.antesBase64}` : form.antesUrl }}
                      style={styles.pickerPreview}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.pickerPlaceholder}>
                      <Ionicons name="camera-outline" size={28} color="#bbb" />
                      <Text style={styles.pickerTexto}>Tocar para seleccionar</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <Text style={theme.inputLabel}>
                  Imagen "Después" {!esEdicion && '*'}
                </Text>
                <TouchableOpacity
                  style={styles.pickerBtn}
                  onPress={() => pickImage('despues')}
                >
                  {(form.despuesBase64 || form.despuesUrl) ? (
                    <Image
                      source={{ uri: form.despuesBase64 ? `data:image/jpeg;base64,${form.despuesBase64}` : form.despuesUrl }}
                      style={styles.pickerPreview}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.pickerPlaceholder}>
                      <Ionicons name="camera-outline" size={28} color="#bbb" />
                      <Text style={styles.pickerTexto}>Tocar para seleccionar</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <View style={theme.modalBotones}>
                  <TouchableOpacity
                    style={theme.btnSecundario}
                    onPress={() => setModal(false)}
                  >
                    <Text style={theme.btnSecundarioTexto}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[theme.btnGuardar, guardandoTrabajo && { opacity: 0.6 }]}
                    onPress={guardarTrabajo}
                    disabled={guardandoTrabajo}
                  >
                    <Text style={theme.btnGuardarTexto}>
                      {guardandoTrabajo ? 'Guardando...' : 'Guardar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  )
}

const styles = StyleSheet.create({
  contenido: { padding: 16, paddingBottom: 120 },
  textarea: { height: 90, textAlignVertical: 'top' },
  trabajoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  trabajoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  trabajoTitulo: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  trabajoDesc: { fontSize: 13, color: COLORS.textLight, marginTop: 3 },
  acciones: { flexDirection: 'row', gap: 4 },
  btnAccion: { padding: 6 },
  imagenesRow: { flexDirection: 'row', gap: 10 },
  imagenBox: { flex: 1 },
  imagenLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  imagenMiniatura: { width: '100%', height: 90, borderRadius: 8 },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerBtn: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    marginBottom: 14,
  },
  pickerPlaceholder: {
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  pickerTexto: { fontSize: 13, color: '#bbb' },
  pickerPreview: { width: '100%', height: 150 },
  diasRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  diaBtn: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 8, borderWidth: 1.5, borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  diaBtnActivo: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  diaBtnTexto: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  diaBtnTextoActivo: { color: '#fff' },
  rangoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  rangoInput: { flex: 1, marginBottom: 0 },
  rangoSep: { fontSize: 18, color: COLORS.textMuted },
})
