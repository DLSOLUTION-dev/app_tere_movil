import { useState, useCallback } from 'react'
import {
    View, Text, StyleSheet, FlatList,
    TouchableOpacity, Alert, TextInput,
    Modal, KeyboardAvoidingView, Platform, Keyboard
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import api from '../../services/api'
import { ESTADO_CITA_LABEL } from '../../types'
import LoadingScreen from '../../components/shared/LoadingScreen'
import Badge from '../../components/ui/Badge'
import { theme } from '../../constants/theme'
import { COLORS } from '../../constants/colors'

const FILTROS = ['TODAS', 'PENDIENTE', 'APROBADA', 'COMPLETADA', 'CANCELADA']
const METODOS_PAGO = [
    { valor: 'EFECTIVO', label: 'Efectivo', icono: 'cash-outline' },
    { valor: 'TRANSFERENCIA', label: 'Transferencia', icono: 'phone-portrait-outline' },
]

export default function CitasAdmin() {
    const [citas, setCitas] = useState([])
    const [filtro, setFiltro] = useState('TODAS')
    const [cargando, setCargando] = useState(true)

    const [modalPago, setModalPago] = useState(false)
    const [citaPagar, setCitaPagar] = useState(null)
    const [subtotal, setSubtotal] = useState('')
    const [metodoPago, setMetodoPago] = useState('EFECTIVO')
    const [guardandoPago, setGuardandoPago] = useState(false)

    useFocusEffect(useCallback(() => { cargarCitas() }, []))

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

    const cambiarEstado = async (id, estado) => {
        const mensajes = {
            APROBADA: '¿Confirmar esta cita?',
            RECHAZADA: '¿Rechazar esta cita?',
            CANCELADA: '¿Cancelar esta cita?',
        }
        Alert.alert('Confirmar acción', mensajes[estado], [
            { text: 'No', style: 'cancel' },
            {
                text: 'Sí',
                onPress: async () => {
                    try {
                        await api.patch(`/citas/${id}/estado`, { estado })
                        await cargarCitas()
                    } catch (e) {
                        Alert.alert('Error', e.response?.data?.mensaje || 'No se pudo actualizar la cita')
                    }
                },
            },
        ])
    }

    const abrirModalPago = (cita) => {
        setCitaPagar(cita)
        setSubtotal('')
        setMetodoPago('EFECTIVO')
        setModalPago(true)
    }

    const registrarPago = async () => {
        if (!subtotal || isNaN(parseFloat(subtotal))) {
            return Alert.alert('Ingresa un monto válido')
        }
        setGuardandoPago(true)
        try {
            await api.patch(`/citas/${citaPagar.id}/estado`, {
                estado: 'COMPLETADA',
                pago: { subtotal: parseFloat(subtotal), metodoPago }
            })
            setModalPago(false)
            setCitaPagar(null)
            setSubtotal('')
            await cargarCitas()
            Alert.alert('✅ Listo', 'Pago registrado y factura generada correctamente')
        } catch (e) {
            Alert.alert('Error', e.response?.data?.mensaje || 'No se pudo registrar el pago')
        } finally {
            setGuardandoPago(false)
        }
    }

    const citasFiltradas = filtro === 'TODAS'
        ? citas
        : citas.filter((c) => c.estado === filtro)

    const renderCita = ({ item }) => (
        <View style={theme.card}>
            {/* Encabezado */}
            <View style={styles.cardHeader}>
                <View style={styles.cardInfo}>
                    <Text style={styles.nombre}>
                        {item.cliente?.nombre} {item.cliente?.apellido}
                    </Text>
                    <Text style={styles.servicio}>{item.servicio?.nombre}</Text>
                </View>
                <Badge estado={item.estado} />
            </View>

            <Text style={styles.fecha}>
                📅 {new Date(item.fechaHora).toLocaleString('es-EC', {
                    dateStyle: 'full', timeStyle: 'short'
                })}
            </Text>
            {item.cliente?.telefono &&
                <Text style={styles.detalle}>📞 {item.cliente.telefono}</Text>
            }
            {item.notas &&
                <Text style={styles.notas}>💬 {item.notas}</Text>
            }

            {/* Botones PENDIENTE */}
            {item.estado === 'PENDIENTE' && (
                <View style={styles.botones}>
                    <TouchableOpacity
                        style={[styles.btn, { backgroundColor: COLORS.success }]}
                        onPress={() => cambiarEstado(item.id, 'APROBADA')}
                    >
                        <Ionicons name="checkmark" size={16} color={COLORS.white} />
                        <Text style={styles.btnTextoBlanco}>Aprobar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.btn, { backgroundColor: COLORS.danger }]}
                        onPress={() => cambiarEstado(item.id, 'RECHAZADA')}
                    >
                        <Ionicons name="close" size={16} color={COLORS.white} />
                        <Text style={styles.btnTextoBlanco}>Rechazar</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Botones APROBADA */}
            {item.estado === 'APROBADA' && (
                <View style={styles.botones}>
                    <TouchableOpacity
                        style={[styles.btn, { backgroundColor: COLORS.primary }]}
                        onPress={() => abrirModalPago(item)}
                    >
                        <Ionicons name="cash-outline" size={16} color={COLORS.white} />
                        <Text style={styles.btnTextoBlanco}>Registrar pago</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.btn, { backgroundColor: COLORS.dangerLight, flex: 0.6 }]}
                        onPress={() => cambiarEstado(item.id, 'CANCELADA')}
                    >
                        <Ionicons name="ban" size={16} color={COLORS.danger} />
                        <Text style={styles.btnTextoRojo}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Resumen factura COMPLETADA */}
            {item.estado === 'COMPLETADA' && item.factura && (
                <View style={styles.facturaResumen}>
                    <Ionicons name="receipt-outline" size={14} color={COLORS.secondary} />
                    <Text style={styles.facturaTexto}>
                        {item.factura.numeroFactura} · ${Number(item.factura.total).toFixed(2)} ·{' '}
                        {item.factura.metodoPago === 'EFECTIVO' ? 'Efectivo' : 'Transferencia'}
                    </Text>
                </View>
            )}
        </View>
    )

    if (cargando) return <LoadingScreen />

    return (
        <View style={theme.container}>

            {/* Header */}
            <View style={theme.header}>
                <Text style={theme.titulo}>Citas</Text>
                <TouchableOpacity onPress={cargarCitas}>
                    <Ionicons name="refresh" size={22} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            {/* Filtros */}
            <View style={styles.filtrosContainer}>
                {FILTROS.map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filtro, filtro === f && styles.filtroActivo]}
                        onPress={() => setFiltro(f)}
                    >
                        <Text style={[styles.filtroTexto, filtro === f && styles.filtroTextoActivo]}>
                            {f === 'TODAS' ? 'Todas' : ESTADO_CITA_LABEL[f]}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={citasFiltradas}
                keyExtractor={(i) => i.id}
                renderItem={renderCita}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                ListEmptyComponent={
                    <Text style={theme.vacio}>No hay citas en esta categoría</Text>
                }
            />

            {/* Modal de pago */}
            <Modal visible={modalPago} animationType="slide" transparent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <TouchableOpacity
                        style={theme.modalOverlay}
                        activeOpacity={1}
                        onPress={() => { Keyboard.dismiss(); setModalPago(false) }}
                    >
                        <View style={theme.modal} onStartShouldSetResponder={() => true}>
                            <Text style={theme.modalTitulo}>Registrar pago</Text>

                            <View style={styles.citaResumen}>
                                <Text style={styles.citaResumenNombre}>
                                    {citaPagar?.cliente?.nombre} {citaPagar?.cliente?.apellido}
                                </Text>
                                <Text style={styles.citaResumenServicio}>
                                    {citaPagar?.servicio?.nombre} · {citaPagar?.servicio?.duracionMin} min
                                </Text>
                            </View>

                            <Text style={theme.inputLabel}>Monto del servicio</Text>
                            <TextInput
                                style={theme.input}
                                placeholder="Ej: 25.00"
                                value={subtotal}
                                onChangeText={setSubtotal}
                                keyboardType="numeric"
                                returnKeyType="done"
                                onSubmitEditing={() => Keyboard.dismiss()}
                            />

                            <Text style={theme.inputLabel}>Método de pago</Text>
                            <View style={styles.metodosRow}>
                                {METODOS_PAGO.map((m) => (
                                    <TouchableOpacity
                                        key={m.valor}
                                        style={[styles.metodoBtn, metodoPago === m.valor && styles.metodoBtnActivo]}
                                        onPress={() => setMetodoPago(m.valor)}
                                    >
                                        <Ionicons
                                            name={m.icono}
                                            size={20}
                                            color={metodoPago === m.valor ? COLORS.white : COLORS.primary}
                                        />
                                        <Text style={[
                                            styles.metodoBtnTexto,
                                            metodoPago === m.valor && { color: COLORS.white }
                                        ]}>
                                            {m.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={theme.modalBotones}>
                                <TouchableOpacity
                                    style={theme.btnSecundario}
                                    onPress={() => setModalPago(false)}
                                >
                                    <Text style={theme.btnSecundarioTexto}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[theme.btnGuardar, guardandoPago && { opacity: 0.6 }]}
                                    onPress={registrarPago}
                                    disabled={guardandoPago}
                                >
                                    <Text style={theme.btnGuardarTexto}>
                                        {guardandoPago ? 'Guardando...' : 'Confirmar pago'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </Modal>

        </View>
    )
}

const styles = StyleSheet.create({
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    cardInfo: { flex: 1, marginRight: 8 },
    nombre: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
    servicio: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
    fecha: { fontSize: 13, color: '#555', marginBottom: 4 },
    detalle: { fontSize: 13, color: '#555', marginBottom: 4 },
    notas: { fontSize: 13, color: COLORS.textMuted, fontStyle: 'italic', marginBottom: 4 },
    botones: { flexDirection: 'row', gap: 10, marginTop: 12 },
    btn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14, flex: 1, justifyContent: 'center' },
    btnTextoBlanco: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
    btnTextoRojo: { color: COLORS.danger, fontWeight: '700', fontSize: 13 },
    facturaResumen: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: COLORS.background, borderRadius: 8, padding: 10 },
    facturaTexto: { fontSize: 12, color: COLORS.secondary, fontWeight: '600' },
    filtrosContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
    filtro: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.background },
    filtroActivo: { backgroundColor: COLORS.primary },
    filtroTexto: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
    filtroTextoActivo: { color: COLORS.white },
    citaResumen: { backgroundColor: COLORS.background, borderRadius: 10, padding: 14, marginBottom: 16 },
    citaResumenNombre: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
    citaResumenServicio: { fontSize: 13, color: COLORS.textLight, marginTop: 4 },
    metodosRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    metodoBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, padding: 14, backgroundColor: COLORS.background, borderWidth: 1.5, borderColor: 'transparent' },
    metodoBtnActivo: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    metodoBtnTexto: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
})