import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import PropTypes from 'prop-types'
import { theme } from '../../constants/theme'
import { COLORS } from '../../constants/colors'

export default function Header({ titulo, conBack = false, accionDerecha }) {
    const router = useRouter()

    return (
        <View style={conBack ? theme.headerBack : theme.header}>
            {conBack && (
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
                </TouchableOpacity>
            )}
            <Text style={conBack ? theme.tituloMd : theme.titulo}>{titulo}</Text>
            {accionDerecha || <View />}
        </View>
    )
}

Header.propTypes = {
    titulo: PropTypes.string.isRequired,
    conBack: PropTypes.bool,
    accionDerecha: PropTypes.node,
}