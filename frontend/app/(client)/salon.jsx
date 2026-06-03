import { useState, useCallback } from 'react'
import {
  View, Text, ScrollView, Image,
  StyleSheet, TouchableOpacity
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import api from '../../services/api'
import LoadingScreen from '../../components/shared/LoadingScreen'
import { COLORS } from '../../constants/colors'

export default function SalonScreen() {
  const [info, setInfo] = useState(null)
  const [trabajos, setTrabajos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [expandido, setExpandido] = useState(null)

  useFocusEffect(useCallback(() => { cargarDatos() }, []))

  const cargarDatos = async () => {
    try {
      const [infoRes, trabajosRes] = await Promise.all([
        api.get('/info-salon'),
        api.get('/trabajos'),
      ])
      setInfo(infoRes.data.data)
      setTrabajos(trabajosRes.data.data)
    } catch {
      // sin datos aún — no interrumpir
    } finally {
      setCargando(false)
    }
  }

  if (cargando) return <LoadingScreen />

  return (
    <ScrollView style={styles.container}>

      {/* Banner */}
      <View style={styles.banner}>
        <Ionicons name="sparkles" size={28} color="rgba(255,255,255,0.8)" />
        <Text style={styles.bannerNombre}>Tere Móvil</Text>
        <Text style={styles.bannerSub}>Salón de belleza</Text>
      </View>

      {/* Visión */}
      {info?.vision ? (
        <View style={styles.seccion}>
          <View style={styles.seccionHeader}>
            <Ionicons name="eye-outline" size={20} color={COLORS.secondary} />
            <Text style={styles.seccionTitulo}>Visión</Text>
          </View>
          <Text style={styles.seccionTexto}>{info.vision}</Text>
        </View>
      ) : null}

      {/* Misión */}
      {info?.mision ? (
        <View style={styles.seccion}>
          <View style={styles.seccionHeader}>
            <Ionicons name="star-outline" size={20} color={COLORS.secondary} />
            <Text style={styles.seccionTitulo}>Misión</Text>
          </View>
          <Text style={styles.seccionTexto}>{info.mision}</Text>
        </View>
      ) : null}

      {/* Contacto */}
      {info?.contacto ? (
        <View style={styles.seccion}>
          <View style={styles.seccionHeader}>
            <Ionicons name="call-outline" size={20} color={COLORS.secondary} />
            <Text style={styles.seccionTitulo}>Contacto</Text>
          </View>
          <Text style={styles.seccionTexto}>{info.contacto}</Text>
        </View>
      ) : null}

      {/* Trabajos realizados */}
      {trabajos.length > 0 && (
        <View style={styles.trabajosSection}>
          <Text style={styles.trabajosSectionTitulo}>Nuestros trabajos</Text>
          {trabajos.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={styles.trabajoCard}
              onPress={() => setExpandido(expandido === t.id ? null : t.id)}
              activeOpacity={0.85}
            >
              <View style={styles.trabajoHeader}>
                <Text style={styles.trabajoTitulo}>{t.titulo}</Text>
                <Ionicons
                  name={expandido === t.id ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={COLORS.textMuted}
                />
              </View>
              {t.descripcion ? (
                <Text style={styles.trabajoDesc}>{t.descripcion}</Text>
              ) : null}
              {expandido === t.id && (
                <View style={styles.imagenRow}>
                  <View style={styles.imagenBox}>
                    <Text style={styles.imagenLabel}>Antes</Text>
                    <Image
                      source={{ uri: t.antesUrl }}
                      style={styles.imagen}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.imagenBox}>
                    <Text style={styles.imagenLabel}>Después</Text>
                    <Image
                      source={{ uri: t.despuesUrl }}
                      style={styles.imagen}
                      resizeMode="cover"
                    />
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!info?.vision && !info?.mision && !info?.contacto && trabajos.length === 0 && (
        <View style={styles.vacio}>
          <Ionicons name="sparkles-outline" size={48} color="#ddd" />
          <Text style={styles.vacioTexto}>Próximamente</Text>
          <Text style={styles.vacioSub}>El salón aún no ha agregado información</Text>
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  banner: {
    backgroundColor: COLORS.primary,
    padding: 32,
    paddingTop: 60,
    alignItems: 'center',
    gap: 8,
  },
  bannerNombre: { fontSize: 28, fontWeight: '700', color: COLORS.white },
  bannerSub: { fontSize: 14, color: 'rgba(255,255,255,0.65)', letterSpacing: 1 },
  seccion: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    margin: 16,
    marginBottom: 0,
    padding: 16,
  },
  seccionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  seccionTitulo: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  seccionTexto: { fontSize: 14, color: COLORS.textLight, lineHeight: 22 },
  trabajosSection: { margin: 16, marginTop: 20 },
  trabajosSectionTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 12,
  },
  trabajoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  trabajoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trabajoTitulo: { fontSize: 15, fontWeight: '700', color: COLORS.primary, flex: 1 },
  trabajoDesc: { fontSize: 13, color: COLORS.textLight, marginTop: 6 },
  imagenRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  imagenBox: { flex: 1 },
  imagenLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 5,
  },
  imagen: { width: '100%', height: 150, borderRadius: 10 },
  vacio: { alignItems: 'center', marginTop: 80, gap: 10 },
  vacioTexto: { fontSize: 16, fontWeight: '600', color: '#aaa' },
  vacioSub: { fontSize: 13, color: '#ccc', textAlign: 'center' },
})
