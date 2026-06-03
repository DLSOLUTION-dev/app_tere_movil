import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import api from '../../services/api'
import useAuthStore from '../../store/authStore'
import { ENDPOINTS } from '../../constants/api'
import { COLORS } from '../../constants/colors'

export default function PerfilCliente() {
  const router = useRouter()
  const usuario = useAuthStore((s) => s.usuario)
  const logout = useAuthStore((s) => s.logout)
  const actualizarUsuario = useAuthStore((s) => s.actualizarUsuario)

  const [nombre, setNombre] = useState(usuario?.nombre || '')
  const [apellido, setApellido] = useState(usuario?.apellido || '')
  const [telefono, setTelefono] = useState(usuario?.telefono || '')
  const [guardando, setGuardando] = useState(false)

  const [passwordActual, setPasswordActual] = useState('')
  const [passwordNuevo, setPasswordNuevo] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [verActual, setVerActual] = useState(false)
  const [verNuevo, setVerNuevo] = useState(false)
  const [cambiandoPass, setCambiandoPass] = useState(false)

  const guardarPerfil = async () => {
    if (!nombre.trim() || !apellido.trim()) {
      return Alert.alert('Error', 'Nombre y apellido son requeridos')
    }
    setGuardando(true)
    try {
      const { data } = await api.put(ENDPOINTS.PERFIL, { nombre: nombre.trim(), apellido: apellido.trim(), telefono: telefono.trim() })
      await actualizarUsuario(data.data)
      Alert.alert('Listo', 'Perfil actualizado correctamente')
    } catch (e) {
      Alert.alert('Error', e.response?.data?.mensaje || 'No se pudo actualizar el perfil')
    } finally {
      setGuardando(false)
    }
  }

  const cambiarPassword = async () => {
    if (!passwordActual || !passwordNuevo || !passwordConfirm) {
      return Alert.alert('Error', 'Completa todos los campos de contraseña')
    }
    if (passwordNuevo !== passwordConfirm) {
      return Alert.alert('Error', 'Las contraseñas nuevas no coinciden')
    }
    if (passwordNuevo.length < 8) {
      return Alert.alert('Error', 'La contraseña nueva debe tener al menos 8 caracteres')
    }
    setCambiandoPass(true)
    try {
      await api.put(ENDPOINTS.CAMBIAR_PASSWORD, { passwordActual, passwordNuevo })
      Alert.alert('Listo', 'Contraseña actualizada correctamente')
      setPasswordActual('')
      setPasswordNuevo('')
      setPasswordConfirm('')
    } catch (e) {
      Alert.alert('Error', e.response?.data?.mensaje || 'No se pudo cambiar la contraseña')
    } finally {
      setCambiandoPass(false)
    }
  }

  const confirmarLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          await logout()
          router.replace('/(auth)/login')
        },
      },
    ])
  }

  const iniciales = `${usuario?.nombre?.[0] || ''}${usuario?.apellido?.[0] || ''}`.toUpperCase()

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.contenido}>

        {/* Avatar */}
        <View style={styles.avatarArea}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTexto}>{iniciales}</Text>
          </View>
          <Text style={styles.nombre}>{usuario?.nombre} {usuario?.apellido}</Text>
          <Text style={styles.email}>{usuario?.email}</Text>
        </View>

        {/* Datos personales */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Datos personales</Text>

          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Tu nombre"
            autoCapitalize="words"
          />

          <Text style={styles.label}>Apellido</Text>
          <TextInput
            style={styles.input}
            value={apellido}
            onChangeText={setApellido}
            placeholder="Tu apellido"
            autoCapitalize="words"
          />

          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            style={styles.input}
            value={telefono}
            onChangeText={setTelefono}
            placeholder="Ej: 0987654321"
            keyboardType="phone-pad"
          />

          <Text style={styles.emailFijo}>
            <Ionicons name="lock-closed-outline" size={13} color={COLORS.textMuted} /> {usuario?.email} — no se puede cambiar
          </Text>

          <TouchableOpacity
            style={[styles.btnPrimario, guardando && { opacity: 0.6 }]}
            onPress={guardarPerfil}
            disabled={guardando}
          >
            <Text style={styles.btnPrimarioTexto}>
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Cambiar contraseña */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Cambiar contraseña</Text>

          <Text style={styles.label}>Contraseña actual</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              value={passwordActual}
              onChangeText={setPasswordActual}
              placeholder="••••••••"
              secureTextEntry={!verActual}
            />
            <TouchableOpacity style={styles.ojo} onPress={() => setVerActual(v => !v)}>
              <Ionicons name={verActual ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Contraseña nueva</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              value={passwordNuevo}
              onChangeText={setPasswordNuevo}
              placeholder="Mínimo 8 caracteres"
              secureTextEntry={!verNuevo}
            />
            <TouchableOpacity style={styles.ojo} onPress={() => setVerNuevo(v => !v)}>
              <Ionicons name={verNuevo ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirmar contraseña nueva</Text>
          <TextInput
            style={styles.input}
            value={passwordConfirm}
            onChangeText={setPasswordConfirm}
            placeholder="Repite la nueva contraseña"
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.btnSecundario, cambiandoPass && { opacity: 0.6 }]}
            onPress={cambiarPassword}
            disabled={cambiandoPass}
          >
            <Text style={styles.btnSecundarioTexto}>
              {cambiandoPass ? 'Actualizando...' : 'Cambiar contraseña'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Cerrar sesión */}
        <TouchableOpacity style={styles.btnLogout} onPress={confirmarLogout}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
          <Text style={styles.btnLogoutTexto}>Cerrar sesión</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  contenido: { paddingBottom: 60 },

  avatarArea: { alignItems: 'center', paddingTop: 60, paddingBottom: 24, backgroundColor: COLORS.primary },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarTexto: { fontSize: 28, fontWeight: '700', color: COLORS.white },
  nombre: { fontSize: 20, fontWeight: '700', color: COLORS.white, marginBottom: 4 },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },

  seccion: { backgroundColor: COLORS.white, borderRadius: 16, margin: 16, marginBottom: 0, padding: 20 },
  seccionTitulo: { fontSize: 14, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 },

  label: { fontSize: 13, fontWeight: '600', color: COLORS.primary, marginBottom: 6, marginTop: 10 },
  input: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, padding: 13, fontSize: 15, color: COLORS.primary, marginBottom: 4, backgroundColor: COLORS.white },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, backgroundColor: COLORS.white, marginBottom: 4 },
  ojo: { paddingHorizontal: 14 },
  emailFijo: { fontSize: 12, color: COLORS.textMuted, marginTop: 8, marginBottom: 16 },

  btnPrimario: { backgroundColor: COLORS.primary, borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 8 },
  btnPrimarioTexto: { color: COLORS.white, fontSize: 15, fontWeight: '700' },

  btnSecundario: { backgroundColor: COLORS.purpleLight, borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 8 },
  btnSecundarioTexto: { color: COLORS.secondary, fontSize: 15, fontWeight: '700' },

  btnLogout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 16, marginTop: 16, padding: 16, backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.dangerLight },
  btnLogoutTexto: { color: COLORS.danger, fontSize: 15, fontWeight: '700' },
})
