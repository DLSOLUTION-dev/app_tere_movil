import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import useAuthStore from '../../store/authStore'

export default function RegistroScreen() {
  const router    = useRouter()
  const registro  = useAuthStore((s) => s.registro)
  const cargando  = useAuthStore((s) => s.cargando)

  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', password: '', telefono: '',
  })

  const actualizar = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }))

  const handleRegistro = async () => {
    if (!form.nombre || !form.apellido || !form.email || !form.password) {
      return Alert.alert('Completa los campos obligatorios')
    }
    const resultado = await registro(form)
    if (!resultado.ok) return Alert.alert('Error', resultado.mensaje)

    const usuario = useAuthStore.getState().usuario
    if (usuario?.rol === 'ADMIN') {
      router.replace('/(admin)/dashboard')
    } else {
      router.replace('/(client)/salon')
    }
  }

  return (
    <View style={styles.background}>

      {/* Círculos decorativos */}
      <View style={styles.circulo1} />
      <View style={styles.circulo2} />
      <View style={styles.circulo3} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>

          {/* Ícono salón */}
          <View style={styles.logoArea}>
            <View style={styles.iconoBg}>
              <Ionicons name="sparkles" size={28} color="#7c6ef7" />
            </View>
          </View>

          <Text style={styles.titulo}>Crear cuenta</Text>
          <Text style={styles.subtitulo}>Únete a Tere Móvil</Text>

          {[
            { campo: 'nombre',   placeholder: 'Nombre *' },
            { campo: 'apellido', placeholder: 'Apellido *' },
            { campo: 'email',    placeholder: 'Correo electrónico *', keyboard: 'email-address' },
            { campo: 'telefono', placeholder: 'Teléfono (opcional)',  keyboard: 'phone-pad' },
            { campo: 'password', placeholder: 'Contraseña (mín. 6 caracteres) *', secure: true },
          ].map(({ campo, placeholder, keyboard, secure }) => (
            <TextInput
              key={campo}
              style={styles.input}
              placeholder={placeholder}
              placeholderTextColor="#aaa"
              value={form[campo]}
              onChangeText={(v) => actualizar(campo, v)}
              keyboardType={keyboard || 'default'}
              autoCapitalize={campo === 'email' ? 'none' : 'words'}
              secureTextEntry={!!secure}
            />
          ))}

          <TouchableOpacity
            style={[styles.boton, cargando && { opacity: 0.6 }]}
            onPress={handleRegistro}
            disabled={cargando}
          >
            <Text style={styles.botonTexto}>
              {cargando ? 'Registrando...' : 'Crear cuenta'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#1a1a2e' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },

  // Círculos decorativos
  circulo1: {
    position: 'absolute', top: -90, right: -90,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(124,110,247,0.28)',
  },
  circulo2: {
    position: 'absolute', bottom: 40, left: -110,
    width: 320, height: 320, borderRadius: 160,
    backgroundColor: 'rgba(124,110,247,0.16)',
  },
  circulo3: {
    position: 'absolute', top: '20%', right: -60,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },

  // Card formulario
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  logoArea: { alignItems: 'center', marginBottom: 16 },
  iconoBg: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#eeedfe',
    justifyContent: 'center', alignItems: 'center',
  },
  titulo:    { fontSize: 28, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  subtitulo: { fontSize: 14, color: '#888', marginBottom: 24 },
  input: {
    borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 10, padding: 14,
    marginBottom: 14, fontSize: 15, color: '#1a1a2e',
  },
  boton: {
    backgroundColor: '#1a1a2e', borderRadius: 10,
    padding: 16, alignItems: 'center', marginBottom: 16,
  },
  botonTexto: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { textAlign: 'center', color: '#7c6ef7', fontSize: 14 },
})
