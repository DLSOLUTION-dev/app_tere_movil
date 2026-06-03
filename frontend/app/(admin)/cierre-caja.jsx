import { useEffect, useState } from 'react'
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, Alert, TextInput,
    Modal, KeyboardAvoidingView, Platform, Keyboard
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import api from '../../services/api'
import { theme } from '../../constants/theme'
import { COLORS } from '../../constants/colors'
import LoadingScreen from '../../components/shared/LoadingScreen'
import Header from '../../components/shared/Header'

const TABS = ['Hoy', 'Historial']

export default function CierreCaja() {
    const [tabActiva, setTabActiva] = useState('Hoy')
    const [preview, setPreview] = useState(null)
    const [historial, setHistorial] = useState([])
    const [cargando, setCargando] = useState(true)

    const [modalCierre, setModalCierre] = useState(false)
    const [retiro, setRetiro] = useState('')
    const [notas, setNotas] = useState('')
    const [cerrando, setCerrando] = useState(false)
    const [yaCerro, setYaCerro] = useState(false)

    useEffect(() => { cargarDatos() }, [])

    const cargarDatos = async () => {
        try {
            const [prevRes, histRes] = await Promise.all([
                api.get('/cierre-caja/preview'),
                api.get('/cierre-caja/historial'),
            ])
            setPreview(prevRes.data.data)
            setHistorial(histRes.data.data)

            const hoy = new Date().toDateString()
            const cierreHoy = histRes.data.data.find(
                (c) => new Date(c.fecha).toDateString() === hoy
            )
            setYaCerro(!!cierreHoy)
        } catch {
            Alert.alert('Error', 'No se pudo cargar la información de caja')
        } finally {
            setCargando(false)
        }
    }

    const abrirCierre = () => {
        setRetiro('')
        setNotas('')
        setModalCierre(true)
    }

    const confirmarCierre = async () => {
        const montoRetiro = parseFloat(retiro || 0)

        if (retiro && isNaN(montoRetiro)) {
            return Alert.alert('Ingresa un monto válido')
        }
        if (montoRetiro > Number(preview?.totalDisponible || 0)) {
            return Alert.alert('Error', 'El retiro no puede ser mayor al total disponible')
        }

        const saldoQueda = Number(preview?.totalDisponible || 0) - montoRetiro

        Alert.alert(
            '¿Cerrar caja?',
            `Retiro: $${montoRetiro.toFixed(2)}\nQueda en caja: $${saldoQueda.toFixed(2)}`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar cierre',
                    onPress: async () => {
                        setCerrando(true)
                        try {
                            await api.post('/cierre-caja', { retiro: montoRetiro, notas })
                            setModalCierre(false)
                            await cargarDatos()
                            Alert.alert('✅ Caja cerrada', `Saldo para mañana: $${saldoQueda.toFixed(2)}`)
                        } catch (e) {
                            Alert.alert('Error', e.response?.data?.mensaje || 'No se pudo cerrar la caja')
                        } finally {
                            setCerrando(false)
                        }
                    }
                }
            ]
        )
    }

    if (cargando) return <LoadingScreen />

    return (
        <View style={theme.container}>

            <Header
                titulo="Cierre de caja"
                conBack
                accionDerecha={
                    <TouchableOpacity onPress={cargarDatos}>
                        <Ionicons name="refresh" size={22} color={COLORS.primary} />
                    </TouchableOpacity>
                }
            />

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

                {/* ── TAB HOY ── */}
                {tabActiva === 'Hoy' && (
                    <>
                        <View style={styles.saldoInicialCard}>
                            <Text style={styles.saldoInicialLabel}>Saldo inicial del día</Text>
                            <Text style={styles.saldoInicialValor}>
                                ${Number(preview?.saldoInicial || 0).toFixed(2)}
                            </Text>
                        </View>

                        <View style={styles.resumenRow}>
                            <View style={[styles.resumenCard, { backgroundColor: COLORS.successLight }]}>
                                <Ionicons name="trending-up" size={22} color={COLORS.success} />
                                <Text style={[styles.resumenLabel, { color: COLORS.successDark }]}>Ingresos</Text>
                                <Text style={[styles.resumenValor, { color: COLORS.successDark }]}>
                                    ${Number(preview?.totalIngresos || 0).toFixed(2)}
                                </Text>
                            </View>
                            <View style={[styles.resumenCard, { backgroundColor: COLORS.dangerLight }]}>
                                <Ionicons name="trending-down" size={22} color={COLORS.danger} />
                                <Text style={[styles.resumenLabel, { color: COLORS.dangerDark }]}>Egresos</Text>
                                <Text style={[styles.resumenValor, { color: COLORS.dangerDark }]}>
                                    ${Number(preview?.totalEgresos || 0).toFixed(2)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.totalCard}>
                            <Text style={styles.totalLabel}>Total disponible en caja</Text>
                            <Text style={styles.totalValor}>
                                ${Number(preview?.totalDisponible || 0).toFixed(2)}
                            </Text>
                        </View>

                        {yaCerro ? (
                            <View style={styles.cerradoCard}>
                                <Ionicons name="checkmark-circle" size={32} color={COLORS.success} />
                                <Text style={styles.cerradoTexto}>Caja cerrada hoy</Text>
                                <Text style={styles.cerradoSub}>Revisa el historial para ver el detalle</Text>
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.btnCerrar} onPress={abrirCierre}>
                                <Ionicons name="lock-closed-outline" size={20} color={COLORS.white} />
                                <Text style={styles.btnCerrarTexto}>Cerrar caja del día</Text>
                            </TouchableOpacity>
                        )}
                    </>
                )}

                {/* ── TAB HISTORIAL ── */}
                {tabActiva === 'Historial' && (
                    <>
                        {historial.length === 0
                            ? <Text style={theme.vacio}>No hay cierres registrados aún</Text>
                            : historial.map((cierre) => (
                                <View key={cierre.id} style={styles.cierreCard}>
                                    <View style={styles.cierreHeader}>
                                        <Text style={styles.cierreFecha}>
                                            📅 {new Date(cierre.fecha).toLocaleDateString('es-EC', {
                                                weekday: 'long', day: 'numeric',
                                                month: 'long', year: 'numeric'
                                            })}
                                        </Text>
                                        <View style={styles.saldoFinalBadge}>
                                            <Text style={styles.saldoFinalBadgeTexto}>
                                                ${Number(cierre.saldoFinal).toFixed(2)}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.cierreDesglose}>
                                        <View style={styles.cierreRow}>
                                            <Text style={styles.cierreRowLabel}>Saldo inicial</Text>
                                            <Text style={styles.cierreRowValor}>
                                                ${Number(cierre.saldoInicial).toFixed(2)}
                                            </Text>
                                        </View>
                                        <View style={styles.cierreRow}>
                                            <Text style={styles.cierreRowLabel}>Ingresos del día</Text>
                                            <Text style={[styles.cierreRowValor, { color: COLORS.success }]}>
                                                +${Number(cierre.totalIngresos).toFixed(2)}
                                            </Text>
                                        </View>
                                        <View style={styles.cierreRow}>
                                            <Text style={styles.cierreRowLabel}>Egresos del día</Text>
                                            <Text style={[styles.cierreRowValor, { color: COLORS.danger }]}>
                                                -${Number(cierre.totalEgresos).toFixed(2)}
                                            </Text>
                                        </View>
                                        {Number(cierre.retiroTerasa) > 0 && (
                                            <View style={styles.cierreRow}>
                                                <Text style={styles.cierreRowLabel}>Retiro Teresa</Text>
                                                <Text style={[styles.cierreRowValor, { color: COLORS.danger }]}>
                                                    -${Number(cierre.retiroTerasa).toFixed(2)}
                                                </Text>
                                            </View>
                                        )}
                                        <View style={[styles.cierreRow, styles.cierreRowTotal]}>
                                            <Text style={styles.cierreRowLabelTotal}>Quedó en caja</Text>
                                            <Text style={styles.cierreRowValorTotal}>
                                                ${Number(cierre.saldoFinal).toFixed(2)}
                                            </Text>
                                        </View>
                                    </View>

                                    {cierre.notas && (
                                        <Text style={styles.cierreNotas}>💬 {cierre.notas}</Text>
                                    )}
                                </View>
                            ))
                        }
                    </>
                )}

            </ScrollView>

            {/* Modal cierre */}
            <Modal visible={modalCierre} animationType="slide" transparent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <TouchableOpacity
                        style={theme.modalOverlay}
                        activeOpacity={1}
                        onPress={() => { Keyboard.dismiss(); setModalCierre(false) }}
                    >
                        <View style={theme.modal} onStartShouldSetResponder={() => true}>
                            <Text style={theme.modalTitulo}>Cerrar caja del día</Text>

                            <View style={styles.modalResumen}>
                                <Text style={styles.modalResumenTexto}>
                                    Total disponible:{' '}
                                    <Text style={{ fontWeight: '700', color: COLORS.primary }}>
                                        ${Number(preview?.totalDisponible || 0).toFixed(2)}
                                    </Text>
                                </Text>
                            </View>

                            <Text style={theme.inputLabel}>
                                ¿Cuánto retira Teresa? (deja vacío si no retira nada)
                            </Text>
                            <TextInput
                                style={theme.input}
                                placeholder="Ej: 30.00"
                                value={retiro}
                                onChangeText={setRetiro}
                                keyboardType="numeric"
                                returnKeyType="next"
                            />

                            {(retiro === '' || !isNaN(parseFloat(retiro))) && (
                                <View style={styles.saldoPreview}>
                                    <Text style={styles.saldoPreviewTexto}>Queda en caja mañana:</Text>
                                    <Text style={styles.saldoPreviewValor}>
                                        ${(Number(preview?.totalDisponible || 0) - parseFloat(retiro || 0)).toFixed(2)}
                                    </Text>
                                </View>
                            )}

                            <Text style={theme.inputLabel}>Notas (opcional)</Text>
                            <TextInput
                                style={[theme.input, { height: 80, textAlignVertical: 'top' }]}
                                placeholder="Ej: Día tranquilo, 3 servicios"
                                value={notas}
                                onChangeText={setNotas}
                                multiline
                                returnKeyType="done"
                            />

                            <View style={theme.modalBotones}>
                                <TouchableOpacity
                                    style={theme.btnSecundario}
                                    onPress={() => setModalCierre(false)}
                                >
                                    <Text style={theme.btnSecundarioTexto}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[theme.btnGuardar, cerrando && { opacity: 0.6 }]}
                                    onPress={confirmarCierre}
                                    disabled={cerrando}
                                >
                                    <Text style={theme.btnGuardarTexto}>
                                        {cerrando ? 'Cerrando...' : 'Cerrar caja'}
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
    contenido: { padding: 16, paddingBottom: 100 },
    saldoInicialCard: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 20, alignItems: 'center', marginBottom: 14 },
    saldoInicialLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    saldoInicialValor: { color: COLORS.white, fontSize: 32, fontWeight: '700', marginTop: 6 },
    resumenRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
    resumenCard: { flex: 1, borderRadius: 14, padding: 16, gap: 6 },
    resumenLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
    resumenValor: { fontSize: 22, fontWeight: '700' },
    totalCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 20, alignItems: 'center', marginBottom: 20, borderWidth: 2, borderColor: COLORS.primary },
    totalLabel: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    totalValor: { fontSize: 36, fontWeight: '700', color: COLORS.primary, marginTop: 6 },
    btnCerrar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: COLORS.primary, borderRadius: 14, padding: 18 },
    btnCerrarTexto: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
    cerradoCard: { backgroundColor: COLORS.successLight, borderRadius: 14, padding: 24, alignItems: 'center', gap: 8 },
    cerradoTexto: { fontSize: 18, fontWeight: '700', color: COLORS.successDark },
    cerradoSub: { fontSize: 13, color: COLORS.success, textAlign: 'center' },
    cierreCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 12 },
    cierreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    cierreFecha: { fontSize: 13, fontWeight: '600', color: COLORS.primary, flex: 1, textTransform: 'capitalize' },
    saldoFinalBadge: { backgroundColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
    saldoFinalBadgeTexto: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
    cierreDesglose: { backgroundColor: COLORS.background, borderRadius: 10, padding: 12, gap: 8 },
    cierreRow: { flexDirection: 'row', justifyContent: 'space-between' },
    cierreRowLabel: { fontSize: 13, color: COLORS.textLight },
    cierreRowValor: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
    cierreRowTotal: { borderTopWidth: 1, borderTopColor: '#e0dfd8', paddingTop: 8, marginTop: 4 },
    cierreRowLabelTotal: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
    cierreRowValorTotal: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
    cierreNotas: { fontSize: 13, color: COLORS.textMuted, fontStyle: 'italic', marginTop: 10 },
    modalResumen: { backgroundColor: COLORS.background, borderRadius: 10, padding: 14, marginBottom: 16 },
    modalResumenTexto: { fontSize: 14, color: COLORS.textLight },
    saldoPreview: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.purpleLight, borderRadius: 10, padding: 14, marginBottom: 12 },
    saldoPreviewTexto: { fontSize: 13, color: COLORS.purpleDark, fontWeight: '600' },
    saldoPreviewValor: { fontSize: 18, fontWeight: '700', color: COLORS.purpleDark },
})