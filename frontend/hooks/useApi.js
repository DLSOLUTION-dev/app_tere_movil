import { useState, useEffect, useCallback } from 'react'
import { Alert } from 'react-native'
import api from '../services/api'

export const useApi = (endpoint, opciones = {}) => {
    const { ejecutarAlInicio = true } = opciones

    const [data, setData] = useState(null)
    const [cargando, setCargando] = useState(ejecutarAlInicio)
    const [error, setError] = useState(null)

    const cargar = useCallback(async () => {
        setCargando(true)
        setError(null)
        try {
            const { data: res } = await api.get(endpoint)
            setData(res.data)
        } catch (e) {
            const mensaje = e.response?.data?.mensaje || 'Error al cargar datos'
            setError(mensaje)
            Alert.alert('Error', mensaje)
        } finally {
            setCargando(false)
        }
    }, [endpoint])

    useEffect(() => {
        if (ejecutarAlInicio) cargar()
    }, [])

    return { data, cargando, error, recargar: cargar }
}