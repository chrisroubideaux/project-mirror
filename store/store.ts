// store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./features/userSlice";
import adminReducer from "./features/adminSlice";
import themeReducer from "./features/themeSlice";
import uiReducer from "./features/uiSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,   // kept for future use
    admin: adminReducer, // your admin login route
    theme: themeReducer, // site theme (light/dark)
    ui: uiReducer,       // global UI states (modals, sidebar, etc.)
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;