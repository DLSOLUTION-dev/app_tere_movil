import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import api from '../../services/api'
import useAuthStore from '../../store/authStore'
import LoadingScreen from '../../components/shared/LoadingScreen'
import { theme } from '../../constants/theme'
import { COLORS } from '../../constants/colors'

export default function Dashboard() {
    const router = useRouter()
    const usuario = useAuthStore((s) => s.usuario)
    const logout = useAuthStore((s) => s.logout)

    const [resumen, setResumen] = useState(null)
    const [citas, setCitas] = useState([])
    const [cargando, setCargando] = useState(true)

    useEffect(() => { cargarDatos() }, [])

    const cargarDatos = async () => {
        const [resCaja, resCitas] = await Promise.allSettled([
            api.get('/caja/resumen'),
            api.get('/citas'),
        ])
        if (resCaja.status === 'fulfilled') setResumen(resCaja.value.data.data)
        if (resCitas.status === 'fulfilled') {
            setCitas(resCitas.value.data.data.filter((c) => c.estado === 'PENDIENTE').slice(0, 5))
        }
        setCargando(false)
    }

    if (cargando) return <LoadingScreen />

    return (
        <ScrollView style={theme.container}>

            {/* Header */}
            <View style={theme.header}>
                <View>
                    <Text style={styles.saludo}>Hola, {usuario?.nombre} 👋</Text>
                    <Text style={styles.fecha}>
                        {new Date().toLocaleDateString('es-EC', {
                            weekday: 'long', day: 'numeric', month: 'long'
                        })}
                    </Text>
                </View>
                <TouchableOpacity onPress={async () => {
                    await logout()
                    router.replace('/(auth)/login')
                }}>
                    <Ionicons name="log-out-outline" size={26} color={COLORS.textMuted} />
                </TouchableOpacity>
            </View>

            {/* Tarjetas financieras */}
            <View style={styles.tarjetasRow}>
                <View style={[styles.tarjeta, { backgroundColor: COLORS.primary }]}>
                    <Text style={styles.tarjetaLabel}>Ingresos</Text>
                    <Text style={styles.tarjetaValor}>
                        ${resumen?.totalIngresos?.toFixed(2) || '0.00'}
                    </Text>
                    <Ionicons name="trending-up" size={20} color={COLORS.secondary} />
                </View>
                <View style={[styles.tarjeta, { backgroundColor: COLORS.background }]}>
                    <Text style={[styles.tarjetaLabel, { color: COLORS.textMuted }]}>Egresos</Text>
                    <Text style={[styles.tarjetaValor, { color: COLORS.primary }]}>
                        ${resumen?.totalEgresos?.toFixed(2) || '0.00'}
                    </Text>
                    <Ionicons name="trending-down" size={20} color={COLORS.danger} />
                </View>
                <View style={[styles.tarjeta, { backgroundColor: COLORS.background }]}>
                    <Text style={[styles.tarjetaLabel, { color: COLORS.textMuted }]}>Balance</Text>
                    <Text style={[styles.tarjetaValor, { color: COLORS.primary }]}>
                        ${resumen?.balance?.toFixed(2) || '0.00'}
                    </Text>
                    <Ionicons name="wallet-outline" size={20} color={COLORS.success} />
                </View>
            </View>

            {/* Citas pendientes */}
            <View style={styles.seccion}>
                <View style={styles.seccionHeader}>
                    <Text style={theme.seccionTitulo}>Citas pendientes</Text>
                    <TouchableOpacity onPress={() => router.push('/(admin)/citas')}>
                        <Text style={styles.verTodo}>Ver todas</Text>
                    </TouchableOpacity>
                </View>

                {citas.length === 0
                    ? <Text style={theme.vacio}>No hay citas pendientes</Text>
                    : citas.map((cita) => (
                        <View key={cita.id} style={styles.citaCard}>
                            <View style={styles.citaInfo}>
                                <Text style={styles.citaNombre}>
                                    {cita.cliente?.nombre} {cita.cliente?.apellido}
                                </Text>
                                <Text style={styles.citaServicio}>{cita.servicio?.nombre}</Text>
                                <Text style={styles.citaFecha}>
                                    📅 {new Date(cita.fechaHora).toLocaleString('es-EC', {
                                        dateStyle: 'medium', timeStyle: 'short'
                                    })}
                                </Text>
                            </View>
                            <View style={styles.pendienteBadge}>
                                <Text style={styles.pendienteTexto}>Pendiente</Text>
                            </View>
                        </View>
                    ))
                }
            </View>

            {/* Accesos rápidos */}
            <View style={styles.seccion}>
                <Text style={theme.seccionTitulo}>Accesos rápidos</Text>
                <View style={styles.accesoGrid}>
                    {[
                        { label: 'Cierre caja', icon: 'lock-closed-outline', ruta: '/(admin)/cierre-caja' },
                        { label: 'Facturas', icon: 'receipt-outline', ruta: '/(admin)/finanzas' },
                    ].map((item) => (
                        <TouchableOpacity
                            key={item.label}
                            style={styles.accesoBtn}
                            onPress={() => router.push(item.ruta)}
                        >
                            <Ionicons name={item.icon} size={26} color={COLORS.primary} />
                            <Text style={styles.accesoLabel}>{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

        </ScrollView>
    )
}

const styles = StyleSheet.create({
    saludo: { fontSize: 22, fontWeight: '700', color: COLORS.primary },
    fecha: { fontSize: 13, color: COLORS.textMuted, marginTop: 2, textTransform: 'capitalize' },
    tarjetasRow: { flexDirection: 'row', gap: 10, padding: 16 },
    tarjeta: { flex: 1, borderRadius: 14, padding: 14, gap: 6 },
    tarjetaLabel: { fontSize: 11, color: '#ffffff90', fontWeight: '600', textTransform: 'uppercase' },
    tarjetaValor: { fontSize: 18, fontWeight: '700', color: COLORS.white },
    seccion: { backgroundColor: COLORS.white, borderRadius: 16, margin: 16, marginTop: 0, padding: 16 },
    seccionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    verTodo: { fontSize: 13, color: COLORS.secondary, fontWeight: '600' },
    citaCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
    citaInfo: { flex: 1 },
    citaNombre: { fontSize: 15, fontWeight: '600', color: COLORS.primary },
    citaServicio: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
    citaFecha: { fontSize: 12, color: '#aaa', marginTop: 3 },
    pendienteBadge: { backgroundColor: COLORS.warningLight, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
    pendienteTexto: { fontSize: 11, color: COLORS.warning, fontWeight: '600' },
    accesoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
    accesoBtn: { flex: 1, minWidth: '45%', backgroundColor: COLORS.background, borderRadius: 12, padding: 16, alignItems: 'center', gap: 8 },
    accesoLabel: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
})