// store/slices/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit"

// 1. Tambahkan id dan avatar agar sesuai kebutuhan UI & Database
interface User {
  id: number
  username: string
  name: string
  email: string
  avatar?: string // Optional, jaga-jaga kalau user belum upload foto
}

interface AuthState {
  user: User | null
  // Opsional: tambahkan ini jika butuh status loading saat cek token awal
  isLoading: boolean 
}

const initialState: AuthState = {
  user: null,
  isLoading: true, // Default true, sampai kita selesai cek cookies di client
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload
      state.isLoading = false
    },
    logout(state) {
      state.user = null
      state.isLoading = false
    },
    // Action untuk mematikan loading jika tidak ada user
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload
    }
  },
})

export const { setUser, logout, setLoading } = authSlice.actions
export default authSlice.reducer