import { useEffect, useState } from 'react'
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, Alert, TextInput,
    Modal, KeyboardAvoidingView, Platform, Keyboard
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import api from '../../../services/api'
import Badge from '../../../components/ui/Badge'
import LoadingScreen from '../../../components/shared/LoadingScreen'
import { theme } from '../../../constants/theme'
import { COLORS } from '../../../constants/colors'

const TABS = ['Citas', 'Fichas', 'Deudas']

export default function DetalleCliente() {
    const { id } = useLocalSearchParams()
    const router = useRouter()

    const [cliente, setCliente] = useState(null)
    const [tabActiva, setTabActiva] = useState('Citas')
    const [cargando, setCargando] = useState(true)

    // Modal ficha
    const [modalFicha, setModalFicha] = useState(false)
    const [tipoCabello, setTipoCabello] = useState('')
    const [colorActual, setColorActual] = useState('')
    const [formulaUsada, setFormulaUsada] = useState('')
    const [observaciones, setObservaciones] = useState('')

    // Modal deuda
    const [modalDeuda, setModalDeuda] = useState(false)
    const [montoDeuda, setMontoDeuda] = useState('')
    const [descDeuda, setDescDeuda] = useState('')

    useEffect(() => { cargarCliente() }, [id])

    const cargarCliente = async () => {
        try {
            const { data } = await api.get(`/clientes/${id}`)
            setCliente(data.data)
        } catch {
            Alert.alert('Error', 'No se pudo cargar el cliente')
        } finally {
            setCargando(false)
        }
    }

    const guardarFicha = async () => {
        if (!tipoCabello) return Alert.alert('El tipo de cabello es requerido')
        try {
            await api.post('/fichas', {
                clienteId: id, tipoCabello, colorActual, formulaUsada, observaciones,
            })
            setModalFicha(false)
            setTipoCabello(''); setColorActual(''); setFormulaUsada(''); setObservaciones('')
            await cargarCliente()
        } catch {
            Alert.alert('Error', 'No se pudo guardar la ficha')
        }
    }

    const guardarDeuda = async () => {
        if (!montoDeuda || !descDeuda) return Alert.alert('Completa todos los campos')
        try {
            await api.post('/deudores', { clienteId: id, monto: montoDeuda, descripcion: descDeuda })
            setModalDeuda(false)
            setMontoDeuda(''); setDescDeuda('')
            await cargarCliente()
        } catch {
            Alert.alert('Error', 'No se pudo registrar la deuda')
        }
    }

    const cambiarRol = () => {
        const nuevoRol = cliente.rol === 'ADMIN' ? 'CLIENTE' : 'ADMIN'
        const mensaje = nuevoRol === 'ADMIN'
            ? `¿Convertir a ${cliente.nombre} en administrador? Tendrá acceso total al sistema.`
            : `¿Quitar permisos de administrador a ${cliente.nombre}?`

        Alert.alert('Cambiar rol', mensaje, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Confirmar',
                style: nuevoRol === 'ADMIN' ? 'default' : 'destructive',
                onPress: async () => {
                    try {
                        await api.patch(`/clientes/${id}/rol`, { rol: nuevoRol })
                        await cargarCliente()
                        Alert.alert('✅ Rol actualizado', `${cliente.nombre} ahora es ${nuevoRol === 'ADMIN' ? 'administrador' : 'cliente'}`)
                    } catch {
                        Alert.alert('Error', 'No se pudo cambiar el rol')
                    }
                },
            },
        ])
    }

    const marcarPagado = async (deudaId) => {
        Alert.alert('¿Marcar como pagado?', '', [
            { text: 'No', style: 'cancel' },
            {
                text: 'Sí',
                onPress: async () => {
                    try {
                        await api.patch(`/deudores/${deudaId}/pagar`)
                        await cargarCliente()
                    } catch {
                        Alert.alert('Error', 'No se pudo actualizar')
                    }
                },
            },
        ])
    }

    if (cargando) return <LoadingScreen />

    return (
        <View style={theme.container}>

            {/* Header con nombre del cliente */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.clienteNombre}>
                        {cliente?.nombre} {cliente?.apellido}
                    </Text>
                    <Text style={styles.clienteEmail}>{cliente?.email}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.rolBadge, cliente?.rol === 'ADMIN' && styles.rolBadgeAdmin]}
                    onPress={cambiarRol}
                >
                    <Ionicons
                        name={cliente?.rol === 'ADMIN' ? 'shield-checkmark' : 'person-outline'}
                        size={13}
                        color={cliente?.rol === 'ADMIN' ? '#7c6ef7' : '#888'}
                    />
                    <Text style={[styles.rolTexto, cliente?.rol === 'ADMIN' && styles.rolTextoAdmin]}>
                        {cliente?.rol === 'ADMIN' ? 'Admin' : 'Cliente'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Tabs */}
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

            <ScrollView contentContainerStyle={styles.contenido}>

                {/* ── TAB CITAS ── */}
                {tabActiva === 'Citas' && (
                    <>
                        {cliente?.citasComoCliente?.length === 0
                            ? <Text style={theme.vacio}>Sin citas registradas</Text>
                            : cliente?.citasComoCliente?.map((cita) => (
                                <View key={cita.id} style={theme.card}>
                                    <View style={theme.cardRow}>
                                        <Text style={theme.cardTitulo}>{cita.servicio?.nombre}</Text>
                                        <Badge estado={cita.estado} />
                                    </View>
                                    <Text style={theme.cardSub}>
                                        📅 {new Date(cita.fechaHora).toLocaleString('es-EC', {
                                            dateStyle: 'medium', timeStyle: 'short'
                                        })}
                                    </Text>
                                </View>
                            ))
                        }
                    </>
                )}

                {/* ── TAB FICHAS ── */}
                {tabActiva === 'Fichas' && (
                    <>
                        <TouchableOpacity
                            style={styles.btnAgregar}
                            onPress={() => setModalFicha(true)}
                        >
                            <Ionicons name="add" size={18} color={COLORS.white} />
                            <Text style={styles.btnAgregarTexto}>Nueva ficha de color</Text>
                        </TouchableOpacity>

                        {cliente?.fichas?.length === 0
                            ? <Text style={theme.vacio}>Sin fichas registradas</Text>
                            : cliente?.fichas?.map((ficha) => (
                                <View key={ficha.id} style={theme.card}>
                                    <Text style={theme.cardTitulo}>
                                        {new Date(ficha.fecha).toLocaleDateString('es-EC', { dateStyle: 'medium' })}
                                    </Text>
                                    <Text style={theme.cardSub}>Cabello: {ficha.tipoCabello}</Text>
                                    {ficha.colorActual && <Text style={theme.cardSub}>Color actual: {ficha.colorActual}</Text>}
                                    {ficha.formulaUsada && <Text style={theme.cardSub}>Fórmula: {ficha.formulaUsada}</Text>}
                                    {ficha.observaciones && <Text style={theme.cardSub}>Obs: {ficha.observaciones}</Text>}
                                </View>
                            ))
                        }
                    </>
                )}

                {/* ── TAB DEUDAS ── */}
                {tabActiva === 'Deudas' && (
                    <>
                        <TouchableOpacity
                            style={styles.btnAgregar}
                            onPress={() => setModalDeuda(true)}
                        >
                            <Ionicons name="add" size={18} color={COLORS.white} />
                            <Text style={styles.btnAgregarTexto}>Registrar deuda</Text>
                        </TouchableOpacity>

                        {cliente?.deudas?.length === 0
                            ? <Text style={theme.vacio}>Sin deudas pendientes</Text>
                            : cliente?.deudas?.map((deuda) => (
                                <View key={deuda.id} style={theme.card}>
                                    <View style={theme.cardRow}>
                                        <Text style={theme.cardTitulo}>
                                            ${Number(deuda.monto).toFixed(2)}
                                        </Text>
                                        <TouchableOpacity
                                            style={styles.btnPagar}
                                            onPress={() => marcarPagado(deuda.id)}
                                        >
                                            <Text style={styles.btnPagarTexto}>Marcar pagado</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={theme.cardSub}>{deuda.descripcion}</Text>
                                    <Text style={theme.cardSub}>
                                        📅 {new Date(deuda.fechaDeuda).toLocaleDateString('es-EC')}
                                    </Text>
                                </View>
                            ))
                        }
                    </>
                )}

            </ScrollView>

            {/* ── Modal ficha de color ── */}
            <Modal visible={modalFicha} animationType="slide" transparent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <TouchableOpacity
                        style={theme.modalOverlay}
                        activeOpacity={1}
                        onPress={() => { Keyboard.dismiss(); setModalFicha(false) }}
                    >
                        <View style={theme.modal} onStartShouldSetResponder={() => true}>
                            <Text style={theme.modalTitulo}>Nueva ficha de color</Text>
                            {[
                                { valor: tipoCabello, setter: setTipoCabello, ph: 'Tipo de cabello *' },
                                { valor: colorActual, setter: setColorActual, ph: 'Color actual' },
                                { valor: formulaUsada, setter: setFormulaUsada, ph: 'Fórmula usada' },
                                { valor: observaciones, setter: setObservaciones, ph: 'Observaciones' },
                            ].map(({ valor, setter, ph }) => (
                                <TextInput
                                    key={ph}
                                    style={theme.input}
                                    placeholder={ph}
                                    value={valor}
                                    onChangeText={setter}
                                />
                            ))}
                            <View style={theme.modalBotones}>
                                <TouchableOpacity
                                    style={theme.btnSecundario}
                                    onPress={() => setModalFicha(false)}
                                >
                                    <Text style={theme.btnSecundarioTexto}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={theme.btnGuardar}
                                    onPress={guardarFicha}
                                >
                                    <Text style={theme.btnGuardarTexto}>Guardar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </Modal>

            {/* ── Modal deuda ── */}
            <Modal visible={modalDeuda} animationType="slide" transparent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <TouchableOpacity
                        style={theme.modalOverlay}
                        activeOpacity={1}
                        onPress={() => { Keyboard.dismiss(); setModalDeuda(false) }}
                    >
                        <View style={theme.modal} onStartShouldSetResponder={() => true}>
                            <Text style={theme.modalTitulo}>Registrar deuda</Text>
                            <TextInput
                                style={theme.input}
                                placeholder="Monto *"
                                value={montoDeuda}
                                onChangeText={setMontoDeuda}
                                keyboardType="numeric"
                            />
                            <TextInput
                                style={theme.input}
                                placeholder="Descripción *"
                                value={descDeuda}
                                onChangeText={setDescDeuda}
                            />
                            <View style={theme.modalBotones}>
                                <TouchableOpacity
                                    style={theme.btnSecundario}
                                    onPress={() => setModalDeuda(false)}
                                >
                                    <Text style={theme.btnSecundarioTexto}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={theme.btnGuardar}
                                    onPress={guardarDeuda}
                                >
                                    <Text style={theme.btnGuardarTexto}>Guardar</Text>
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
    header: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 24, paddingTop: 60, backgroundColor: COLORS.white },
    headerInfo: { flex: 1 },
    clienteNombre: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
    clienteEmail: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
    contenido: { padding: 16, paddingBottom: 100 },
    btnAgregar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: 10, padding: 14, marginBottom: 14, justifyContent: 'center' },
    btnAgregarTexto: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
    btnPagar: { backgroundColor: COLORS.successLight, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
    btnPagarTexto: { color: COLORS.success, fontWeight: '700', fontSize: 12 },
    rolBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f4f3ef', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
    rolBadgeAdmin: { backgroundColor: '#eeedfe' },
    rolTexto: { fontSize: 12, fontWeight: '600', color: '#888' },
    rolTextoAdmin: { color: '#7c6ef7' },
})