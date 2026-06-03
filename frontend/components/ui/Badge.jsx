import { View, Text, StyleSheet } from 'react-native'
import { ESTADO_CITA_COLOR, ESTADO_CITA_LABEL } from '../../types'

export default function Badge({ estado }) {
    return (
        <View style={[styles.badge, { backgroundColor: ESTADO_CITA_COLOR[estado] + '20' }]}>
            <Text style={[styles.texto, { color: ESTADO_CITA_COLOR[estado] }]}>
                {ESTADO_CITA_LABEL[estado]}
            </Text>
        </View>
    )
}

const styles = StyleSheet.create({
    badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
    texto: { fontSize: 11, fontWeight: '700' },
})