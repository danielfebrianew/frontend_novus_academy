import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SidebarState {
  // Key adalah ID menu (misal: 'settings', 'workspace'), Value adalah status (true/false)
  expandedSections: Record<string, boolean>; 
}

const initialState: SidebarState = {
  expandedSections: {
    // TRUE: defaultnya TERBUKA semua
    "playground": true, 
    "workspace": true,
    "reports": true,  
    "settings": true, 
  },
};

const sidebarSlice = createSlice({
  name: "sidebar",
  initialState,
  reducers: {
    // Action untuk toggle (buka/tutup) saat diklik
    toggleSection: (state, action: PayloadAction<string>) => {
      const sectionId = action.payload;

      const current = state.expandedSections[sectionId] || false;
      state.expandedSections[sectionId] = !current;
    },
    setSectionOpen: (state, action: PayloadAction<{ id: string; isOpen: boolean }>) => {
      const { id, isOpen } = action.payload;
      state.expandedSections[id] = isOpen;
    },
  },
});

export const { toggleSection, setSectionOpen } = sidebarSlice.actions;
export default sidebarSlice.reducer;