import { useEffect, useState } from 'react'
import {
    View, Text, StyleSheet, FlatList,
    TouchableOpacity, TextInput, Alert
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import api from '../../services/api'
import LoadingScreen from '../../components/shared/LoadingScreen'
import { theme } from '../../constants/theme'
import { COLORS } from '../../constants/colors'

export default function ClientesAdmin() {
    const router = useRouter()

    const [clientes, setClientes] = useState([])
    const [busqueda, setBusqueda] = useState('')
    const [cargando, setCargando] = useState(true)

    useEffect(() => { cargarClientes() }, [])

    const cargarClientes = async () => {
        try {
            const { data } = await api.get('/clientes')
            setClientes(data.data)
        } catch {
            Alert.alert('Error', 'No se pudieron cargar los clientes')
        } finally {
            setCargando(false)
        }
    }

    const clientesFiltrados = clientes.filter((c) => {
        const texto = `${c.nombre} ${c.apellido} ${c.email}`.toLowerCase()
        return texto.includes(busqueda.toLowerCase())
    })

    const renderCliente = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/(admin)/cliente/${item.id}`)}
        >
            <View style={styles.avatar}>
                <Text style={styles.avatarTexto}>
                    {item.nombre[0]}{item.apellido[0]}
                </Text>
            </View>
            <View style={styles.info}>
                <Text style={styles.nombre}>{item.nombre} {item.apellido}</Text>
                <Text style={styles.email}>{item.email}</Text>
                {item.telefono &&
                    <Text style={styles.telefono}>📞 {item.telefono}</Text>
                }
            </View>
            <View style={styles.lado}>
                <Text style={styles.citasCount}>
                    {item._count?.citasComoCliente || 0} citas
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </View>
        </TouchableOpacity>
    )

    if (cargando) return <LoadingScreen />

    return (
        <View style={theme.container}>

            {/* Header */}
            <View style={theme.header}>
                <Text style={theme.titulo}>Clientes</Text>
                <Text style={styles.total}>{clientes.length} registrados</Text>
            </View>

            {/* Buscador */}
            <View style={styles.buscadorContainer}>
                <Ionicons name="search" size={18} color="#aaa" style={styles.buscadorIcono} />
                <TextInput
                    style={styles.buscador}
                    placeholder="Buscar por nombre o email..."
                    value={busqueda}
                    onChangeText={setBusqueda}
                />
                {busqueda.length > 0 &&
                    <TouchableOpacity onPress={() => setBusqueda('')}>
                        <Ionicons name="close-circle" size={18} color="#aaa" />
                    </TouchableOpacity>
                }
            </View>

            <FlatList
                data={clientesFiltrados}
                keyExtractor={(i) => i.id}
                renderItem={renderCliente}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                ListEmptyComponent={
                    <Text style={theme.vacio}>No se encontraron clientes</Text>
                }
            />

        </View>
    )
}

const styles = StyleSheet.create({
    total: { fontSize: 13, color: COLORS.textMuted },
    buscadorContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, margin: 16, marginTop: 8, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: COLORS.border },
    buscadorIcono: { marginRight: 8 },
    buscador: { flex: 1, paddingVertical: 12, fontSize: 15 },
    card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
    avatarTexto: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
    info: { flex: 1 },
    nombre: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
    email: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
    telefono: { fontSize: 12, color: '#aaa', marginTop: 2 },
    lado: { alignItems: 'flex-end', gap: 4 },
    citasCount: { fontSize: 11, color: COLORS.secondary, fontWeight: '600' },
})