import { create } from 'zustand'

const useNotifStore = create((set) => ({
    noLeidas: 0,
    setNoLeidas: (n) => set({ noLeidas: n }),
}))

export default useNotifStore
