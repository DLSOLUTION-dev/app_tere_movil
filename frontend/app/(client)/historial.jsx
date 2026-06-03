import { useState, useCallback } from 'react'
import {
    View, Text, StyleSheet, FlatList,
    Alert, TouchableOpacity
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import api from '../../services/api'
import { ESTADO_CITA_COLOR, ESTADO_CITA_LABEL } from '../../types'
import LoadingScreen from '../../components/shared/LoadingScreen'

export default function Historial() {
    const [tabActiva, setTabActiva] = useState('Citas')
    const [citas, setCitas] = useState([])
    const [fichas, setFichas] = useState([])
    const [cargando, setCargando] = useState(true)

    useFocusEffect(useCallback(() => { cargarDatos() }, []))

    const cargarDatos = async () => {
        setCargando(true)
        try {
            const [citasRes, fichasRes] = await Promise.allSettled([
                api.get('/citas/historial'),
                api.get('/fichas/mias'),
            ])
            if (citasRes.status === 'fulfilled') setCitas(citasRes.value.data.data)
            if (fichasRes.status === 'fulfilled') setFichas(fichasRes.value.data.data)
        } catch {
            Alert.alert('Error', 'No se pudo cargar el historial')
        } finally {
            setCargando(false)
        }
    }

    const renderCita = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.servicio}>{item.servicio?.nombre}</Text>
                <View style={[styles.badge, { backgroundColor: ESTADO_CITA_COLOR[item.estado] + '20' }]}>
                    <Text style={[styles.badgeTexto, { color: ESTADO_CITA_COLOR[item.estado] }]}>
                        {ESTADO_CITA_LABEL[item.estado]}
                    </Text>
                </View>
            </View>

            <View style={styles.fila}>
                <Ionicons name="calendar-outline" size={14} color="#aaa" />
                <Text style={styles.texto}>
                    {new Date(item.fechaHora).toLocaleDateString('es-EC', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })}
                </Text>
            </View>

            <View style={styles.fila}>
                <Ionicons name="time-outline" size={14} color="#aaa" />
                <Text style={styles.texto}>
                    {new Date(item.fechaHora).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>

            {item.servicio?.duracionMin && (
                <View style={styles.fila}>
                    <Ionicons name="hourglass-outline" size={14} color="#aaa" />
                    <Text style={styles.texto}>{item.servicio.duracionMin} minutos</Text>
                </View>
            )}

            {item.factura && (
                <View style={styles.facturaBox}>
                    <View style={styles.fila}>
                        <Ionicons name="receipt-outline" size={14} color="#7c6ef7" />
                        <Text style={styles.facturaNumero}>{item.factura.numeroFactura}</Text>
                    </View>
                    <Text style={styles.facturaTotal}>
                        Total pagado: ${Number(item.factura.total).toFixed(2)}
                    </Text>
                    <Text style={styles.facturaPago}>
                        {item.factura.metodoPago === 'EFECTIVO' ? '💵 Efectivo' : '📱 Transferencia'}
                    </Text>
                </View>
            )}
        </View>
    )

    const renderFicha = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.fichaIconoBg}>
                    <Ionicons name="color-palette-outline" size={18} color="#7c6ef7" />
                </View>
                <Text style={styles.fichaFecha}>
                    {new Date(item.fecha).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
            </View>

            <View style={styles.fichaFila}>
                <Text style={styles.fichaLabel}>Tipo de cabello</Text>
                <Text style={styles.fichaValor}>{item.tipoCabello}</Text>
            </View>
            {item.colorActual && (
                <View style={styles.fichaFila}>
                    <Text style={styles.fichaLabel}>Color actual</Text>
                    <Text style={styles.fichaValor}>{item.colorActual}</Text>
                </View>
            )}
            {item.observaciones && (
                <View style={[styles.fichaFila, { flexDirection: 'column', gap: 2 }]}>
                    <Text style={styles.fichaLabel}>Observaciones</Text>
                    <Text style={[styles.fichaValor, { marginLeft: 0 }]}>{item.observaciones}</Text>
                </View>
            )}
        </View>
    )

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.titulo}>Mi historial</Text>
                <TouchableOpacity onPress={cargarDatos}>
                    <Ionicons name="refresh" size={22} color="#1a1a2e" />
                </TouchableOpacity>
            </View>

            <View style={styles.tabs}>
                {['Citas', 'Mis fichas'].map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, tabActiva === tab && styles.tabActiva]}
                        onPress={() => setTabActiva(tab)}
                    >
                        <Text style={[styles.tabTexto, tabActiva === tab && styles.tabTextoActivo]}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {cargando ? <LoadingScreen /> : (
                tabActiva === 'Citas' ? (
                    <FlatList
                        data={citas}
                        keyExtractor={(i) => i.id}
                        renderItem={renderCita}
                        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                        ListEmptyComponent={
                            <View style={styles.vacio}>
                                <Ionicons name="time-outline" size={48} color="#ddd" />
                                <Text style={styles.vacioTexto}>Aún no tienes citas completadas</Text>
                                <Text style={styles.vacioSub}>Cuando termines una cita aparecerá aquí</Text>
                            </View>
                        }
                    />
                ) : (
                    <FlatList
                        data={fichas}
                        keyExtractor={(i) => i.id}
                        renderItem={renderFicha}
                        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                        ListEmptyComponent={
                            <View style={styles.vacio}>
                                <Ionicons name="color-palette-outline" size={48} color="#ddd" />
                                <Text style={styles.vacioTexto}>Sin fichas registradas</Text>
                                <Text style={styles.vacioSub}>Teresa llenará tu ficha después de tu primera visita</Text>
                            </View>
                        }
                    />
                )
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f3ef' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 60, backgroundColor: '#fff' },
    titulo: { fontSize: 24, fontWeight: '700', color: '#1a1a2e' },
    tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabActiva: { borderBottomColor: '#1a1a2e' },
    tabTexto: { fontSize: 14, fontWeight: '600', color: '#aaa' },
    tabTextoActivo: { color: '#1a1a2e' },
    card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    servicio: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', flex: 1 },
    badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
    badgeTexto: { fontSize: 11, fontWeight: '700' },
    fila: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
    texto: { fontSize: 13, color: '#666', textTransform: 'capitalize' },
    facturaBox: { marginTop: 12, backgroundColor: '#f4f3ef', borderRadius: 10, padding: 12, gap: 4 },
    facturaNumero: { fontSize: 13, fontWeight: '600', color: '#7c6ef7' },
    facturaTotal: { fontSize: 14, fontWeight: '700', color: '#1a1a2e', marginTop: 4 },
    facturaPago: { fontSize: 13, color: '#666' },
    fichaIconoBg: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#eeedfe', justifyContent: 'center', alignItems: 'center' },
    fichaFecha: { fontSize: 14, fontWeight: '600', color: '#1a1a2e', marginLeft: 10 },
    fichaFila: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 8, gap: 8 },
    fichaLabel: { fontSize: 12, fontWeight: '700', color: '#aaa', textTransform: 'uppercase', minWidth: 110 },
    fichaValor: { fontSize: 14, color: '#1a1a2e', flex: 1, marginLeft: 4 },
    vacio: { alignItems: 'center', marginTop: 80, gap: 10 },
    vacioTexto: { fontSize: 16, fontWeight: '600', color: '#aaa' },
    vacioSub: { fontSize: 13, color: '#ccc', textAlign: 'center' },
})
