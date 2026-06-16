import { useEffect } from 'react'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import api from '../../services/api'
import { ENDPOINTS } from '../../constants/api'
import useNotifStore from '../../store/notifStore'

export default function ClientLayout() {
    const noLeidas = useNotifStore((s) => s.noLeidas)
    const setNoLeidas = useNotifStore((s) => s.setNoLeidas)

    useEffect(() => {
        api.get(ENDPOINTS.NOTIFICACIONES)
            .then(res => setNoLeidas(res.data.data.filter(n => !n.leida).length))
            .catch(() => {})
    }, [])

    const badgeValor = noLeidas > 9 ? '9+' : noLeidas
    const badgeNotif = noLeidas > 0 ? badgeValor : undefined

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#1a1a2e',
                tabBarInactiveTintColor: '#aaa',
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopColor: '#f0efe8',
                    paddingBottom: 6,
                    height: 60,
                },
            }}
        >
            <Tabs.Screen
                name="salon"
                options={{
                    title: 'Inicio',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="sparkles-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="inicio"
                options={{
                    title: 'Mis citas',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="calendar-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="historial"
                options={{
                    title: 'Historial',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="time-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="nueva-cita"
                options={{
                    title: 'Nueva cita',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="add-circle-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="notificaciones"
                options={{
                    title: 'Alertas',
                    tabBarBadge: badgeNotif,
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="notifications-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="perfil"
                options={{
                    title: 'Perfil',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    )
}
