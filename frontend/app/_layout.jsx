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
        const navegarDesdeNotificacion = (response) => {
            const destino = response?.notification?.request?.content?.data?.destino
            router.push(destino || '/(client)/historial')
        }

        // App abierta (foreground/background) y el usuario toca la notificación
        respuestaListener.current = Notifications.addNotificationResponseReceivedListener(
            navegarDesdeNotificacion
        )

        // App estaba cerrada y se abrió tocando la notificación
        const ultimaRespuesta = Notifications.getLastNotificationResponse()
        if (ultimaRespuesta) {
            // Pequeño delay para que el router termine de montar la navegación inicial
            setTimeout(() => navegarDesdeNotificacion(ultimaRespuesta), 500)
        }

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
