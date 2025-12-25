import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SidebarState {
  // Key adalah ID menu (misal: 'settings', 'workspace'), Value adalah status (true/false)
  expandedSections: Record<string, boolean>; 
}

const initialState: SidebarState = {
  expandedSections: {
    "playground": true, // Default terbuka
    "workspace": true,
    "settings": false, // Default tertutup
  },
};

const sidebarSlice = createSlice({
  name: "sidebar",
  initialState,
  reducers: {
    // Action untuk toggle (buka/tutup) saat diklik
    toggleSection: (state, action: PayloadAction<string>) => {
      const sectionId = action.payload;
      // Jika belum ada di state, anggap false lalu negaikan
      const current = state.expandedSections[sectionId] || false;
      state.expandedSections[sectionId] = !current;
    },
    // Action untuk memaksa buka (misal saat deteksi URL)
    setSectionOpen: (state, action: PayloadAction<{ id: string; isOpen: boolean }>) => {
      const { id, isOpen } = action.payload;
      state.expandedSections[id] = isOpen;
    },
  },
});

export const { toggleSection, setSectionOpen } = sidebarSlice.actions;
export default sidebarSlice.reducer;