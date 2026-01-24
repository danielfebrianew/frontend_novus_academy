import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { apiService } from "@/lib/fetch"; // ✅ Ganti dari axios ke fetch

// Definisikan tipe Account
interface Account {
  id: number;
  username: string;
  email: string;
  status: string;
  avatar?: string;
}

interface AccountState {
  selectedAccount: Account | null;
  accounts: Account[];
  loading: boolean;
  error: string | null; // ✅ Tambahkan error state
}

const initialState: AccountState = {
  selectedAccount: null,
  accounts: [],
  loading: false,
  error: null, // ✅ Tambahkan error
};

// --- THUNK: ACTION UNTUK FETCH DATA ---
export const fetchAccountsFromApi = createAsyncThunk(
  "account/fetchList",
  async (_, { rejectWithValue }) => {
    try {
      // ✅ apiService.get sudah return data langsung (bukan response.data)
      const response = await apiService.get<{ data: Account[] }>("/api/v1/accounts");
      
      // ✅ Sesuaikan dengan struktur response backend kamu
      // Jika backend return { data: [...] }, gunakan response.data
      // Jika backend return langsung array, gunakan response
      return response.data || response;
    } catch (error: any) {
      // ✅ Handle error dengan benar untuk fetch API
      return rejectWithValue(error.message || "Gagal memuat data akun");
    }
  }
);

export const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    setSelectedAccount: (state, action: PayloadAction<Account | null>) => {
      state.selectedAccount = action.payload;
    },
    // ✅ Tambahan: Reset error state
    clearError: (state) => {
      state.error = null;
    },
  },
  // Handle hasil fetch dari Thunk
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccountsFromApi.pending, (state) => {
        state.loading = true;
        state.error = null; // ✅ Clear error saat mulai fetch
      })
      .addCase(fetchAccountsFromApi.fulfilled, (state, action) => {
        state.accounts = action.payload;
        state.loading = false;
        state.error = null;
        
        // Opsional: Otomatis pilih akun pertama jika belum ada yang dipilih
        if (!state.selectedAccount && action.payload.length > 0) {
          state.selectedAccount = action.payload[0];
        }
      })
      .addCase(fetchAccountsFromApi.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string; // ✅ Simpan error message
      });
  },
});

export const { setSelectedAccount, clearError } = accountSlice.actions;
export default accountSlice.reducer;