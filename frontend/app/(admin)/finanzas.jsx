import { useEffect, useState } from 'react'
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, Alert
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import api from '../../services/api'
import LoadingScreen from '../../components/shared/LoadingScreen'
import { theme } from '../../constants/theme'
import { COLORS } from '../../constants/colors'

const TABS = ['Resumen', 'Facturas']

export default function Finanzas() {
    const [tabActiva, setTabActiva] = useState('Resumen')
    const [facturas, setFacturas] = useState([])
    const [resumenSema, setResumenSema] = useState(null)
    const [cargando, setCargando] = useState(true)

    useEffect(() => { cargarDatos() }, [])

    const cargarDatos = async () => {
        try {
            const [facRes, resRes] = await Promise.all([
                api.get('/facturas'),
                api.get('/caja/resumen-semana'),
            ])
            setFacturas(facRes.data.data)
            setResumenSema(resRes.data.data)
        } catch {
            Alert.alert('Error', 'No se pudieron cargar los datos financieros')
        } finally {
            setCargando(false)
        }
    }

    const getRangoSemana = () => {
        const hoy = new Date()
        const diaSem = hoy.getDay() === 0 ? 6 : hoy.getDay() - 1
        const lunes = new Date(hoy)
        lunes.setDate(hoy.getDate() - diaSem)
        const domingo = new Date(lunes)
        domingo.setDate(lunes.getDate() + 6)
        const fmt = (d) => d.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })
        return `${fmt(lunes)} - ${fmt(domingo)}`
    }

    const formatMetodoPago = (metodo) => {
        const metodos = {
            EFECTIVO: 'Efectivo',
            TRANSFERENCIA: 'Transferencia',
        }
        return metodos[metodo] || metodo
    }

    if (cargando) return <LoadingScreen />

    return (
        <View style={theme.container}>

            {/* Header */}
            <View style={theme.header}>
                <Text style={theme.titulo}>Finanzas</Text>
                <TouchableOpacity onPress={cargarDatos}>
                    <Ionicons name="refresh" size={22} color={COLORS.primary} />
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

                {/* ── TAB RESUMEN ── */}
                {tabActiva === 'Resumen' && (
                    <>
                        <View style={styles.semanaHeader}>
                            <Ionicons name="calendar-outline" size={16} color={COLORS.secondary} />
                            <Text style={styles.semanaTexto}>
                                Semana actual: {getRangoSemana()}
                            </Text>
                        </View>

                        <View style={styles.ingresosCard}>
                            <Text style={styles.ingresosLabel}>Ingresos de la semana</Text>
                            <Text style={styles.ingresosValor}>
                                ${Number(resumenSema?.totalIngresos || 0).toFixed(2)}
                            </Text>
                            <View style={styles.ingresosFooter}>
                                <Ionicons name="trending-up" size={16} color={COLORS.success} />
                                <Text style={styles.ingresosFooterTexto}>
                                    {resumenSema?.totalCitas || 0} servicios cobrados
                                </Text>
                            </View>
                        </View>

                        {resumenSema?.porDia?.length > 0 && (
                            <>
                                <Text style={theme.seccionTitulo}>Desglose por día</Text>
                                {resumenSema.porDia.map((dia) => (
                                    <View key={`${dia.nombre}-${dia.fecha}`} style={styles.diaCard}>
                                        <View style={styles.diaInfo}>
                                            <Text style={styles.diaNombre}>{dia.nombre}</Text>
                                            <Text style={styles.diaFecha}>{dia.fecha}</Text>
                                        </View>
                                        <Text style={[
                                            styles.diaMonto,
                                            { color: dia.total > 0 ? COLORS.success : '#aaa' }
                                        ]}>
                                            ${Number(dia.total).toFixed(2)}
                                        </Text>
                                    </View>
                                ))}
                            </>
                        )}
                    </>
                )}

                {/* ── TAB FACTURAS ── */}
                {tabActiva === 'Facturas' && (
                    <>
                        {facturas.length === 0
                            ? <Text style={theme.vacio}>No hay facturas registradas</Text>
                            : facturas.map((f) => (
                                <View key={f.id} style={theme.card}>
                                    <View style={theme.cardRow}>
                                        <Text style={theme.cardTitulo}>{f.numeroFactura}</Text>
                                        <Text style={styles.cardMonto}>
                                            ${Number(f.total).toFixed(2)}
                                        </Text>
                                    </View>
                                    <Text style={theme.cardSub}>
                                        👤 {f.cliente?.nombre} {f.cliente?.apellido}
                                    </Text>
                                    <Text style={theme.cardSub}>
                                        💳 {formatMetodoPago(f.metodoPago)}
                                    </Text>
                                    <Text style={theme.cardSub}>
                                        📅 {new Date(f.fechaEmision).toLocaleDateString('es-EC', { dateStyle: 'medium' })}
                                    </Text>
                                </View>
                            ))
                        }
                    </>
                )}

            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    contenido: { padding: 16, paddingBottom: 100 },
    semanaHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.purpleLight, borderRadius: 10, padding: 12, marginBottom: 16 },
    semanaTexto: { fontSize: 13, color: COLORS.purpleDark, fontWeight: '600' },
    ingresosCard: { backgroundColor: COLORS.primary, borderRadius: 16, padding: 24, marginBottom: 16, alignItems: 'center', gap: 8 },
    ingresosLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    ingresosValor: { color: COLORS.white, fontSize: 42, fontWeight: '700' },
    ingresosFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    ingresosFooterTexto: { color: COLORS.success, fontSize: 13, fontWeight: '600' },
    diaCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    diaInfo: { gap: 2 },
    diaNombre: { fontSize: 14, fontWeight: '700', color: COLORS.primary, textTransform: 'capitalize' },
    diaFecha: { fontSize: 12, color: '#aaa' },
    diaMonto: { fontSize: 16, fontWeight: '700' },
    cardMonto: { fontSize: 16, fontWeight: '700', color: COLORS.success },
})