import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import api from './api'

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
})

export const registrarNotificaciones = async () => {
    try {
        if (!Device.isDevice) {
            console.log('Notificaciones solo en dispositivo físico')
            return
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync()
        let finalStatus = existingStatus

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync()
            finalStatus = status
        }

        if (finalStatus !== 'granted') {
            console.log('Permiso denegado')
            return
        }

        // Usar Expo Push Token en vez de FCM directo
        const projectId = Constants.expoConfig?.extra?.eas?.projectId
        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId })

        const expoToken = tokenData.data
        console.log('Expo Push Token:', expoToken)

        // Guardar en backend
        await api.put('/auth/fcm-token', { fcmToken: expoToken })

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
            })
        }
    } catch (e) {
        console.error('Error registrando notificaciones:', e.message)
    }
}