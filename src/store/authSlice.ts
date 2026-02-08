// store/slices/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface User {
  id: number
  username: string
  name: string
  email: string
  avatar?: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isLoading: boolean
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isLoading: true,
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload
      state.isLoading = false
    },
    setAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload
    },
    logout(state) {
      state.user = null
      state.accessToken = null
      state.isLoading = false
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload
    },
  },
})

export const { setUser, setAccessToken, logout, setLoading } = authSlice.actions
export default authSlice.reducer