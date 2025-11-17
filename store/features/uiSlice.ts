// /store/features/uiSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UIState {
  isModalOpen: boolean;
  modalType: string | null;
  sidebarOpen: boolean;
  isLoading: boolean;
  activeSection: string | null;
  mobileMenuOpen: boolean; // ✅ new
}

const initialState: UIState = {
  isModalOpen: false,
  modalType: null,
  sidebarOpen: false,
  isLoading: false,
  activeSection: null,
  mobileMenuOpen: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    openModal(state, action: PayloadAction<string>) {
      state.isModalOpen = true;
      state.modalType = action.payload;
    },
    closeModal(state) {
      state.isModalOpen = false;
      state.modalType = null;
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setActiveSection(state, action: PayloadAction<string | null>) {
      state.activeSection = action.payload;
    },
    toggleMobileMenu(state) {  // ✅ added
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },
    closeMobileMenu(state) {   // ✅ added
      state.mobileMenuOpen = false;
    },
  },
});

export const {
  openModal,
  closeModal,
  toggleSidebar,
  setLoading,
  setActiveSection,
  toggleMobileMenu,
  closeMobileMenu,
} = uiSlice.actions;

export default uiSlice.reducer;