import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

const dashboardIcon = ({ color, size }) => (
    <Ionicons name="home-outline" size={size} color={color} />
)

const citasIcon = ({ color, size }) => (
    <Ionicons name="calendar-outline" size={size} color={color} />
)

const clientesIcon = ({ color, size }) => (
    <Ionicons name="people-outline" size={size} color={color} />
)

const finanzasIcon = ({ color, size }) => (
    <Ionicons name="cash-outline" size={size} color={color} />
)

export default function AdminLayout() {
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
                name="dashboard"
                options={{
                    title: 'Inicio',
                    tabBarIcon: dashboardIcon,
                }}
            />
            <Tabs.Screen
                name="citas"
                options={{
                    title: 'Citas',
                    tabBarIcon: citasIcon,
                }}
            />
            <Tabs.Screen
                name="clientes"
                options={{
                    title: 'Clientes',
                    tabBarIcon: clientesIcon,
                }}
            />
            <Tabs.Screen
                name="finanzas"
                options={{
                    title: 'Finanzas',
                    tabBarIcon: finanzasIcon,
                }}
            />
            <Tabs.Screen
                name="gestion-salon"
                options={{
                    title: 'Galería',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="images-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="cierre-caja"
                options={{ href: null }}
            />
            <Tabs.Screen
                name="cliente/[id]"
                options={{ href: null }}
            />
        </Tabs>

    )
}