import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ReportFilterState {
  accountId: number | null;
  startDate: string;
  endDate: string;
  isFilterSet: boolean; // Penanda apakah user sudah submit filter
}

const initialState: ReportFilterState = {
  accountId: null,
  startDate: "",
  endDate: "",
  isFilterSet: false,
};

const reportSlice = createSlice({
  name: "report",
  initialState,
  reducers: {
    setReportFilters: (state, action: PayloadAction<{ accountId: number; startDate: string; endDate: string }>) => {
      state.accountId = action.payload.accountId;
      state.startDate = action.payload.startDate;
      state.endDate = action.payload.endDate;
      state.isFilterSet = true;
    },
    resetReportFilters: (state) => {
      state.isFilterSet = false;
      // Opsional: mau hapus data tanggalnya juga atau biarkan tersimpan buat default value nanti
      state.startDate = ""; 
      state.endDate = "";
    },
  },
});

export const { setReportFilters, resetReportFilters } = reportSlice.actions;
export default reportSlice.reducer;