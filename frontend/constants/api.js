export const API_URL = process.env.EXPO_PUBLIC_API_URL

export const ENDPOINTS = {
  // Auth
  REGISTRO: '/auth/registro',
  LOGIN: '/auth/login',
  FCM_TOKEN: '/auth/fcm-token',
  PERFIL: '/auth/perfil',
  CAMBIAR_PASSWORD: '/auth/cambiar-password',
  // Citas
  CITAS: '/citas',
  // Servicios
  SERVICIOS: '/servicios',
  // Admin
  CLIENTES: '/clientes',
  FACTURAS: '/facturas',
  DEUDORES: '/deudores',
  NOTIFICACIONES: '/notificaciones/mias',
  NOTIF_LEER_TODAS: '/notificaciones/leer-todas',
}
