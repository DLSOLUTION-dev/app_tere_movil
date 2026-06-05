import { useEffect, useRef } from 'react'
import { Stack, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as Notifications from 'expo-notifications'

// Muestra la notificación como banner aunque la app esté abierta
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
})

export default function RootLayout() {
    const router = useRouter()
    const respuestaListener = useRef()

    useEffect(() => {
        // Cuando el usuario toca una notificación (app en background o cerrada)
        respuestaListener.current = Notifications.addNotificationResponseReceivedListener(() => {
            // Navegar al historial de notificaciones del cliente o al panel admin
            // Por simplicidad llevamos al historial — el usuario ya autenticado
            // verá la pantalla correcta según su rol
            router.push('/(client)/historial')
        })

        return () => {
            if (respuestaListener.current) {
                Notifications.removeNotificationSubscription(respuestaListener.current)
            }
        }
    }, [])

    return (
        <>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }} />
        </>
    )
}
