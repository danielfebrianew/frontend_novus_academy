import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { apiService } from "@/lib/axios";

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
  accounts: Account[]; // <--- TAMBAHAN: Simpan list akun disini
  loading: boolean;
}

const initialState: AccountState = {
  selectedAccount: null,
  accounts: [], // Default kosong
  loading: false,
};

// --- THUNK: ACTION UNTUK FETCH DATA ---
export const fetchAccountsFromApi = createAsyncThunk(
  "account/fetchList",
  async () => {
    const response = await apiService.get<Account[]>("/api/v1/accounts");
    return response;
  }
);

export const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    setSelectedAccount: (state, action: PayloadAction<Account | null>) => {
      state.selectedAccount = action.payload;
    },
  },
  // Handle hasil fetch dari Thunk
  extraReducers: (builder) => {
    builder.addCase(fetchAccountsFromApi.fulfilled, (state, action) => {
      state.accounts = action.payload; // Simpan data ke store
      state.loading = false;
      
      // Opsional: Otomatis pilih akun pertama jika belum ada yang dipilih
      if (!state.selectedAccount && action.payload.length > 0) {
        state.selectedAccount = action.payload[0];
      }
    });
    builder.addCase(fetchAccountsFromApi.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchAccountsFromApi.rejected, (state) => {
      state.loading = false;
    });
  },
});

export const { setSelectedAccount } = accountSlice.actions;
export default accountSlice.reducer;