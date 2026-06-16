import { useState, useCallback, useRef } from 'react'
import {
    View, Text, StyleSheet, FlatList, ScrollView,
    TouchableOpacity, Alert, TextInput,
    Modal, KeyboardAvoidingView, Platform, Keyboard, Switch
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Calendar, LocaleConfig } from 'react-native-calendars'

LocaleConfig.locales['es'] = {
    monthNames: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
    monthNamesShort: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
    dayNames: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],
    dayNamesShort: ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'],
    today: 'Hoy',
}
LocaleConfig.defaultLocale = 'es'
import api from '../../services/api'
import { ESTADO_CITA_LABEL, ESTADO_CITA_COLOR } from '../../types'
import LoadingScreen from '../../components/shared/LoadingScreen'
import Badge from '../../components/ui/Badge'
import { theme } from '../../constants/theme'
import { COLORS } from '../../constants/colors'

const FILTROS = ['TODAS', 'PENDIENTE', 'APROBADA', 'COMPLETADA', 'CANCELADA']
const METODOS_PAGO = [
    { valor: 'EFECTIVO', label: 'Efectivo', icono: 'cash-outline' },
    { valor: 'TRANSFERENCIA', label: 'Transferencia', icono: 'phone-portrait-outline' },
]
const LEYENDA = [
    { estado: 'PENDIENTE', label: 'Pendiente' },
    { estado: 'APROBADA', label: 'Confirmada' },
    { estado: 'COMPLETADA', label: 'Completada' },
    { estado: 'CANCELADA', label: 'Cancelada' },
]

const fechaAKey = (fechaHora) => {
    const d = new Date(fechaHora)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const formatearDiaSeleccionado = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('es-EC', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })
}

export default function CitasAdmin() {
    const [citas, setCitas] = useState([])
    const [filtro, setFiltro] = useState('TODAS')
    const [cargando, setCargando] = useState(true)
    const [vista, setVista] = useState('lista')
    const [diaSeleccionado, setDiaSeleccionado] = useState(null)

    const [modalPago, setModalPago] = useState(false)
    const [citaPagar, setCitaPagar] = useState(null)
    const [subtotal, setSubtotal] = useState('')
    const [metodoPago, setMetodoPago] = useState('EFECTIVO')
    const [guardandoPago, setGuardandoPago] = useState(false)

    const [modalMotivo, setModalMotivo] = useState(false)
    const [accionPendiente, setAccionPendiente] = useState(null)
    const [motivoCancelacion, setMotivoCancelacion] = useState('')
    const [guardandoAccion, setGuardandoAccion] = useState(false)

    const [ofrecerReagendamiento, setOfrecerReagendamiento] = useState(false)
    const [horariosAlternativos, setHorariosAlternativos] = useState([])
    const [modalPicker, setModalPicker] = useState(false)
    const [pickerMode, setPickerMode] = useState('date')
    const [pickerTempDate, setPickerTempDate] = useState(new Date())

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

    const abrirPickerAlternativo = () => {
        setPickerTempDate(new Date())
        setPickerMode('date')
        setModalPicker(true)
    }

    const onPickerChange = (_, selectedDate) => {
        if (selectedDate) setPickerTempDate(selectedDate)
    }

    const avanzarPicker = () => {
        if (pickerMode === 'date') {
            setPickerMode('time')
        } else {
            setHorariosAlternativos(prev => [...prev, pickerTempDate])
            setModalPicker(false)
            setPickerMode('date')
        }
    }

    const cancelarPicker = () => {
        setModalPicker(false)
        setPickerMode('date')
    }

    const quitarAlternativa = (iso) =>
        setHorariosAlternativos(prev => prev.filter(d => d.toISOString() !== iso))

    const cambiarEstado = (id, estado, cita) => {
        if (estado === 'RECHAZADA' || estado === 'CANCELADA') {
            setAccionPendiente({ id, estado, cita })
            setMotivoCancelacion('')
            setOfrecerReagendamiento(false)
            setHorariosAlternativos([])
            setModalMotivo(true)
            return
        }
        Alert.alert('Confirmar acción', '¿Confirmar esta cita?', [
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

    const confirmarAccionConMotivo = async () => {
        if (!accionPendiente) return
        setGuardandoAccion(true)
        try {
            const body = { estado: accionPendiente.estado }
            if (motivoCancelacion.trim()) body.motivoCancelacion = motivoCancelacion.trim()
            if (ofrecerReagendamiento && horariosAlternativos.length > 0) {
                body.horariosAlternativos = horariosAlternativos.map(d => d.toISOString())
            }
            await api.patch(`/citas/${accionPendiente.id}/estado`, body)
            setModalMotivo(false)
            setAccionPendiente(null)
            setOfrecerReagendamiento(false)
            setHorariosAlternativos([])
            await cargarCitas()
        } catch (e) {
            Alert.alert('Error', e.response?.data?.mensaje || 'No se pudo actualizar la cita')
        } finally {
            setGuardandoAccion(false)
        }
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
                        onPress={() => cambiarEstado(item.id, 'RECHAZADA', item)}
                    >
                        <Ionicons name="close" size={16} color={COLORS.white} />
                        <Text style={styles.btnTextoBlanco}>Rechazar</Text>
                    </TouchableOpacity>
                </View>
            )}

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
                        onPress={() => cambiarEstado(item.id, 'CANCELADA', item)}
                    >
                        <Ionicons name="ban" size={16} color={COLORS.danger} />
                        <Text style={styles.btnTextoRojo}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            )}

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

    const textoBotonAccion = accionPendiente?.estado === 'RECHAZADA' ? 'Rechazar' : 'Cancelar'

    // Marcas para el calendario: puntos de color por estado
    const markedDates = {}
    citas.forEach(cita => {
        const key = fechaAKey(cita.fechaHora)
        if (!markedDates[key]) markedDates[key] = { dots: [] }
        if (!markedDates[key].dots.some(dot => dot.key === cita.estado)) {
            markedDates[key].dots.push({ key: cita.estado, color: ESTADO_CITA_COLOR[cita.estado] })
        }
    })
    if (diaSeleccionado) {
        markedDates[diaSeleccionado] = {
            ...(markedDates[diaSeleccionado] || { dots: [] }),
            selected: true,
            selectedColor: COLORS.primary,
        }
    }

    // Citas del día seleccionado ordenadas por hora
    const citasDelDia = diaSeleccionado
        ? citas
            .filter(c => fechaAKey(c.fechaHora) === diaSeleccionado)
            .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora))
        : []

    return (
        <View style={theme.container}>

            {/* Header */}
            <View style={theme.header}>
                <Text style={theme.titulo}>Citas</Text>
                <View style={styles.headerAcciones}>
                    <View style={styles.vistaToggle}>
                        <TouchableOpacity
                            style={[styles.toggleBtn, vista === 'lista' && styles.toggleBtnActivo]}
                            onPress={() => setVista('lista')}
                        >
                            <Ionicons name="list-outline" size={18} color={vista === 'lista' ? COLORS.white : COLORS.textMuted} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.toggleBtn, vista === 'calendario' && styles.toggleBtnActivo]}
                            onPress={() => setVista('calendario')}
                        >
                            <Ionicons name="calendar-outline" size={18} color={vista === 'calendario' ? COLORS.white : COLORS.textMuted} />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={cargarCitas}>
                        <Ionicons name="refresh" size={22} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            {vista === 'lista' ? (
                <>
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
                </>
            ) : (
                <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                    <Calendar
                        markingType="multi-dot"
                        markedDates={markedDates}
                        onDayPress={(day) => setDiaSeleccionado(day.dateString)}
                        theme={{
                            backgroundColor: COLORS.white,
                            calendarBackground: COLORS.white,
                            selectedDayBackgroundColor: COLORS.primary,
                            selectedDayTextColor: COLORS.white,
                            todayTextColor: COLORS.primary,
                            todayBackgroundColor: COLORS.background,
                            dayTextColor: '#2d4150',
                            textDisabledColor: '#d9e1e8',
                            monthTextColor: COLORS.primary,
                            textMonthFontWeight: '700',
                            textMonthFontSize: 16,
                            arrowColor: COLORS.primary,
                        }}
                    />

                    {/* Leyenda de colores */}
                    <View style={styles.leyenda}>
                        {LEYENDA.map(({ estado, label }) => (
                            <View key={estado} style={styles.leyendaItem}>
                                <View style={[styles.leyendaDot, { backgroundColor: ESTADO_CITA_COLOR[estado] }]} />
                                <Text style={styles.leyendaTexto}>{label}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Citas del día seleccionado */}
                    {diaSeleccionado && (
                        <View style={styles.diaContainer}>
                            <Text style={styles.diaTitulo}>
                                {formatearDiaSeleccionado(diaSeleccionado)}
                            </Text>
                            {citasDelDia.length === 0 ? (
                                <View style={styles.sinCitas}>
                                    <Ionicons name="calendar-outline" size={36} color="#ddd" />
                                    <Text style={styles.sinCitasTexto}>Sin citas este día</Text>
                                </View>
                            ) : (
                                <View style={{ paddingHorizontal: 16 }}>
                                    {citasDelDia.map(item => (
                                        <View key={item.id}>
                                            {renderCita({ item })}
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}

                    {!diaSeleccionado && (
                        <View style={styles.sinCitas}>
                            <Ionicons name="finger-print-outline" size={36} color="#ddd" />
                            <Text style={styles.sinCitasTexto}>Toca un día para ver sus citas</Text>
                        </View>
                    )}
                </ScrollView>
            )}

            {/* Modal motivo de rechazo/cancelación */}
            <Modal visible={modalMotivo} animationType="slide" transparent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <TouchableOpacity
                        style={theme.modalOverlay}
                        activeOpacity={1}
                        onPress={() => { if (modalPicker) return; Keyboard.dismiss(); setModalMotivo(false) }}
                    >
                        <View style={theme.modal} onStartShouldSetResponder={() => true}>
                            <Text style={theme.modalTitulo}>
                                {accionPendiente?.estado === 'RECHAZADA' ? 'Rechazar cita' : 'Cancelar cita'}
                            </Text>

                            <View style={styles.citaResumen}>
                                <Text style={styles.citaResumenNombre}>
                                    {accionPendiente?.cita?.cliente?.nombre} {accionPendiente?.cita?.cliente?.apellido}
                                </Text>
                                <Text style={styles.citaResumenServicio}>
                                    {accionPendiente?.cita?.servicio?.nombre}
                                </Text>
                            </View>

                            <Text style={theme.inputLabel}>Motivo (opcional)</Text>
                            <TextInput
                                style={[theme.input, styles.inputMotivo]}
                                placeholder="Ej: Agenda llena, compromiso personal..."
                                placeholderTextColor={COLORS.textMuted}
                                value={motivoCancelacion}
                                onChangeText={setMotivoCancelacion}
                                multiline
                                numberOfLines={3}
                                maxLength={200}
                                textAlignVertical="top"
                            />
                            <Text style={styles.contadorCaracteres}>{motivoCancelacion.length}/200</Text>

                            {/* Proponer horarios alternativos */}
                            <View style={styles.reagendRow}>
                                <Text style={styles.reagendLabel}>Proponer horarios alternativos</Text>
                                <Switch
                                    value={ofrecerReagendamiento}
                                    onValueChange={v => {
                                        setOfrecerReagendamiento(v)
                                        if (!v) setHorariosAlternativos([])
                                    }}
                                    trackColor={{ true: COLORS.primary }}
                                    thumbColor={COLORS.white}
                                />
                            </View>

                            {ofrecerReagendamiento && (
                                <View style={styles.alternativasContainer}>
                                    {horariosAlternativos.map((fecha) => (
                                        <View key={fecha.toISOString()} style={styles.alternativaChip}>
                                            <Ionicons name="time-outline" size={14} color={COLORS.primary} />
                                            <Text style={styles.alternativaTexto}>
                                                {fecha.toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' })}
                                            </Text>
                                            <TouchableOpacity onPress={() => quitarAlternativa(fecha.toISOString())}>
                                                <Ionicons name="close-circle" size={18} color={COLORS.danger} />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                    {horariosAlternativos.length < 3 && (
                                        <TouchableOpacity style={styles.agregarHorarioBtn} onPress={abrirPickerAlternativo}>
                                            <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
                                            <Text style={styles.agregarHorarioTexto}>Agregar horario</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}

                            <View style={theme.modalBotones}>
                                <TouchableOpacity
                                    style={theme.btnSecundario}
                                    onPress={() => setModalMotivo(false)}
                                >
                                    <Text style={theme.btnSecundarioTexto}>Volver</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        theme.btnGuardar,
                                        { backgroundColor: accionPendiente?.estado === 'RECHAZADA' ? COLORS.danger : COLORS.dangerLight },
                                        guardandoAccion && { opacity: 0.6 }
                                    ]}
                                    onPress={confirmarAccionConMotivo}
                                    disabled={guardandoAccion}
                                >
                                    <Text style={[
                                        theme.btnGuardarTexto,
                                        accionPendiente?.estado === 'CANCELADA' && { color: COLORS.danger }
                                    ]}>
                                        {guardandoAccion ? 'Procesando...' : textoBotonAccion}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>

                {/* Picker dentro del mismo Modal — sin conflicto Android */}
                {modalPicker && (
                    <View style={styles.pickerOverlay}>
                        <View style={styles.pickerContainer}>
                            <Text style={styles.pickerTitulo}>
                                {pickerMode === 'date' ? '📅 Selecciona la fecha' : '🕐 Selecciona la hora'}
                            </Text>
                            <DateTimePicker
                                value={pickerTempDate}
                                mode={pickerMode}
                                display="spinner"
                                minimumDate={new Date()}
                                onChange={onPickerChange}
                                locale="es-EC"
                                style={{ width: '100%' }}
                            />
                            <View style={styles.pickerBotones}>
                                <TouchableOpacity style={styles.pickerBtnCancelar} onPress={cancelarPicker}>
                                    <Text style={styles.pickerBtnCancelarTexto}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.pickerBtnConfirmar} onPress={avanzarPicker}>
                                    <Text style={styles.pickerBtnConfirmarTexto}>
                                        {pickerMode === 'date' ? 'Siguiente →' : 'Confirmar'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
                </KeyboardAvoidingView>
            </Modal>

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
    headerAcciones: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    vistaToggle: { flexDirection: 'row', backgroundColor: COLORS.background, borderRadius: 8, padding: 3, gap: 2 },
    toggleBtn: { padding: 6, borderRadius: 6 },
    toggleBtnActivo: { backgroundColor: COLORS.primary },
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
    inputMotivo: { height: 80, paddingTop: 10 },
    contadorCaracteres: { fontSize: 11, color: COLORS.textMuted, textAlign: 'right', marginTop: -10, marginBottom: 16 },
    reagendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    reagendLabel: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
    alternativasContainer: { marginBottom: 16, gap: 8 },
    alternativaChip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.background, borderRadius: 10, padding: 10 },
    alternativaTexto: { flex: 1, fontSize: 13, color: COLORS.primary, fontWeight: '500' },
    agregarHorarioBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
    agregarHorarioTexto: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
    pickerOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
    pickerContainer: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    pickerTitulo: { fontSize: 16, fontWeight: '700', color: COLORS.primary, textAlign: 'center', marginBottom: 8 },
    pickerBotones: { flexDirection: 'row', gap: 12, marginTop: 16 },
    pickerBtnCancelar: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: COLORS.background, alignItems: 'center' },
    pickerBtnCancelarTexto: { color: COLORS.textMuted, fontWeight: '600', fontSize: 14 },
    pickerBtnConfirmar: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center' },
    pickerBtnConfirmarTexto: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
    leyenda: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
    leyendaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    leyendaDot: { width: 8, height: 8, borderRadius: 4 },
    leyendaTexto: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },
    diaContainer: { marginTop: 4 },
    diaTitulo: { fontSize: 15, fontWeight: '700', color: COLORS.primary, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, textTransform: 'capitalize' },
    sinCitas: { alignItems: 'center', paddingVertical: 40, gap: 10 },
    sinCitasTexto: { fontSize: 14, color: '#bbb', fontWeight: '500' },
})
