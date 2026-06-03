import { StyleSheet } from 'react-native'
import { COLORS } from './colors'

export const theme = StyleSheet.create({
    // ── Contenedores ──
    container: { flex: 1, backgroundColor: COLORS.background },
    centrado: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // ── Headers ──
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 60, backgroundColor: COLORS.white },
    headerBack: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 24, paddingTop: 60, backgroundColor: COLORS.white },
    titulo: { fontSize: 24, fontWeight: '700', color: COLORS.primary },
    tituloMd: { fontSize: 20, fontWeight: '700', color: COLORS.primary },

    // ── Tabs ──
    tabs: { flexDirection: 'row', backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
    tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
    tabActiva: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
    tabTexto: { fontSize: 14, color: '#aaa', fontWeight: '600' },
    tabTextoActivo: { color: COLORS.primary },

    // ── Cards ──
    card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 12 },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    cardTitulo: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
    cardSub: { fontSize: 13, color: COLORS.textLight, marginTop: 3 },

    // ── Modales ──
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modal: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
    modalTitulo: { fontSize: 18, fontWeight: '700', color: COLORS.primary, marginBottom: 16 },
    modalBotones: { flexDirection: 'row', gap: 10, marginTop: 8 },

    // ── Inputs ──
    input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 13, marginBottom: 12, fontSize: 15 },
    inputLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },

    // ── Botones ──
    btnPrimario: { backgroundColor: COLORS.primary, borderRadius: 10, padding: 16, alignItems: 'center' },
    btnPrimarioTexto: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
    btnSecundario: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: COLORS.background, alignItems: 'center' },
    btnSecundarioTexto: { color: COLORS.textMuted, fontWeight: '600' },
    btnGuardar: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: 'center' },
    btnGuardarTexto: { color: COLORS.white, fontWeight: '700' },

    // ── Texto vacío ──
    vacio: { textAlign: 'center', color: '#aaa', marginTop: 60, fontSize: 15 },

    // ── Sección ──
    seccionTitulo: { fontSize: 16, fontWeight: '700', color: COLORS.primary, marginBottom: 12 },
})