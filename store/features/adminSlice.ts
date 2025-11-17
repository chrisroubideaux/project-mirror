// store/features/adminSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AdminState {
  isLoggedIn: boolean;
  token: string | null;
  email: string | null;
}

const initialState: AdminState = {
  isLoggedIn: false,
  token: null,
  email: null,
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    adminLogin(state, action: PayloadAction<{ token: string; email: string }>) {
      state.isLoggedIn = true;
      state.token = action.payload.token;
      state.email = action.payload.email;
    },
    adminLogout(state) {
      state.isLoggedIn = false;
      state.token = null;
      state.email = null;
    },
  },
});

export const { adminLogin, adminLogout } = adminSlice.actions;
export default adminSlice.reducer;