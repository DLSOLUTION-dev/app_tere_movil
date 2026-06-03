import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import useAuthStore from '../../store/authStore'

export default function LoginScreen() {
  const router = useRouter()
  const login = useAuthStore((s) => s.login)
  const cargando = useAuthStore((s) => s.cargando)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert('Completa todos los campos')
    }
    const resultado = await login(email, password)
    if (!resultado.ok) {
      return Alert.alert('Error', resultado.mensaje)
    }
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

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>

          {/* Ícono salón */}
          <View style={styles.logoArea}>
            <View style={styles.iconoBg}>
              <Ionicons name="sparkles" size={28} color="#7c6ef7" />
            </View>
          </View>

          <Text style={styles.titulo}>Tere Móvil</Text>
          <Text style={styles.subtitulo}>Inicia sesión para continuar</Text>

          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor="#aaa"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.boton, cargando && styles.botonDeshabilitado]}
            onPress={handleLogin}
            disabled={cargando}
          >
            <Text style={styles.botonTexto}>
              {cargando ? 'Ingresando...' : 'Iniciar sesión'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/registro')}>
            <Text style={styles.link}>¿No tienes cuenta? Regístrate</Text>
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
  },
  flex: { flex: 1, justifyContent: 'center' },

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
    position: 'absolute', top: '38%', left: -50,
    width: 150, height: 150, borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },

  // Card formulario
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    margin: 24,
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
  titulo: { fontSize: 30, fontWeight: '700', color: '#1a1a2e', marginBottom: 6 },
  subtitulo: { fontSize: 14, color: '#888', marginBottom: 28 },
  input: {
    borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 10, padding: 14,
    marginBottom: 14, fontSize: 15, color: '#1a1a2e',
  },
  boton: {
    backgroundColor: '#1a1a2e', borderRadius: 10,
    padding: 16, alignItems: 'center', marginBottom: 16,
  },
  botonDeshabilitado: { opacity: 0.6 },
  botonTexto: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { textAlign: 'center', color: '#7c6ef7', fontSize: 14 },
})
