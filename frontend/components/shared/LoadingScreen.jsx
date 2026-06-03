import { View, ActivityIndicator } from 'react-native'
import { theme } from '../../constants/theme'
import { COLORS } from '../../constants/colors'

export default function LoadingScreen() {
    return (
        <View style={theme.centrado}>
            <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
    )
}