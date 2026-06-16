import { useState, useCallback, useRef } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import api from '../../services/api'
import { ENDPOINTS } from '../../constants/api'
import LoadingScreen from '../../components/shared/LoadingScreen'
import useNotifStore from '../../store/notifStore'

const TIPO_ICONO = {
    RECORDATORIO:   'alarm-outline',
    CONFIRMACION:   'checkmark-circle-outline',
    CANCELACION:    'close-circle-outline',
    REPROGRAMACION: 'calendar-outline',
}

const TIPO_COLOR = {
    RECORDATORIO:   '#f59e0b',
    CONFIRMACION:   '#10b981',
    CANCELACION:    '#ef4444',
    REPROGRAMACION: '#6366f1',
}

export default function NotificacionesCliente() {
    const setNoLeidas = useNotifStore((s) => s.setNoLeidas)

    const [notificaciones, setNotificaciones] = useState([])
    const [cargando, setCargando] = useState(true)
    const cargadoUnaVez = useRef(false)

    useFocusEffect(useCallback(() => { cargarDatos() }, []))

    const cargarDatos = async () => {
        if (!cargadoUnaVez.current) setCargando(true)
        try {
            const res = await api.get(ENDPOINTS.NOTIFICACIONES)
            const data = res.data.data
            setNotificaciones(data)
            setNoLeidas(data.filter(n => !n.leida).length)
        } catch {}
        finally {
            setCargando(false)
            cargadoUnaVez.current = true
        }
    }

    const marcarLeida = async (id) => {
        try {
            await api.put(`/notificaciones/${id}/leer`)
            setNotificaciones(prev => {
                const updated = prev.map(n => n.id === id ? { ...n, leida: true } : n)
                setNoLeidas(updated.filter(n => !n.leida).length)
                return updated
            })
        } catch {}
    }

    const marcarTodasLeidas = async () => {
        try {
            await api.put(ENDPOINTS.NOTIF_LEER_TODAS)
            setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
            setNoLeidas(0)
        } catch {}
    }

    const noLeidas = notificaciones.filter(n => !n.leida).length

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.card, !item.leida && styles.cardNoLeida]}
            onPress={() => !item.leida && marcarLeida(item.id)}
            activeOpacity={0.85}
        >
            <View style={styles.row}>
                <View style={[styles.iconoBg, { backgroundColor: (TIPO_COLOR[item.tipo] ?? '#6366f1') + '20' }]}>
                    <Ionicons
                        name={TIPO_ICONO[item.tipo] ?? 'notifications-outline'}
                        size={18}
                        color={TIPO_COLOR[item.tipo] ?? '#6366f1'}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <View style={styles.headerRow}>
                        <Text style={styles.titulo}>{item.titulo}</Text>
                        {!item.leida && <View style={styles.puntito} />}
                    </View>
                    <Text style={styles.mensaje}>{item.mensaje}</Text>
                    <Text style={styles.fecha}>
                        {new Date(item.enviadaAt).toLocaleDateString('es-EC', {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                        })}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    )

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitulo}>Notificaciones</Text>
            </View>

            {cargando ? <LoadingScreen /> : (
                <FlatList
                    data={notificaciones}
                    keyExtractor={(i) => i.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                    ListHeaderComponent={
                        noLeidas > 0 ? (
                            <TouchableOpacity style={styles.leerTodas} onPress={marcarTodasLeidas}>
                                <Ionicons name="checkmark-done-outline" size={16} color="#6366f1" />
                                <Text style={styles.leerTodasTexto}>Marcar todas como leídas</Text>
                            </TouchableOpacity>
                        ) : null
                    }
                    ListEmptyComponent={
                        <View style={styles.vacio}>
                            <Ionicons name="notifications-off-outline" size={48} color="#ddd" />
                            <Text style={styles.vacioTexto}>Sin notificaciones</Text>
                        </View>
                    }
                />
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f3ef' },
    header: {
        padding: 16, paddingTop: 60, paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
    },
    headerTitulo: { fontSize: 22, fontWeight: '700', color: '#1a1a2e' },
    card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10 },
    cardNoLeida: { borderLeftWidth: 3, borderLeftColor: '#6366f1' },
    row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    iconoBg: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
    titulo: { fontSize: 14, fontWeight: '700', color: '#1a1a2e', flex: 1 },
    puntito: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6366f1' },
    mensaje: { fontSize: 13, color: '#555', lineHeight: 19 },
    fecha: { fontSize: 11, color: '#aaa', marginTop: 5 },
    leerTodas: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, alignSelf: 'flex-end' },
    leerTodasTexto: { fontSize: 13, color: '#6366f1', fontWeight: '600' },
    vacio: { alignItems: 'center', marginTop: 80, gap: 10 },
    vacioTexto: { fontSize: 16, fontWeight: '600', color: '#aaa' },
})
