// store/store.ts

import { configureStore } from "@reduxjs/toolkit";

import userReducer from "./features/userSlice";
import adminReducer from "./features/adminSlice";
import themeReducer from "./features/themeSlice";
import uiReducer from "./features/uiSlice";

import auroraReducer, {
  loadAuroraStateFromStorage,
  saveAuroraStateToStorage,
} from "./features/auroraSlice";


// Load persisted Aurora state (client only)
const persistedAurora =
  typeof window !== "undefined" ? loadAuroraStateFromStorage() : null;


export const store = configureStore({
  reducer: {
    user: userReducer,
    admin: adminReducer,
    theme: themeReducer,
    ui: uiReducer,
    aurora: auroraReducer,
  },

  // Hydrate Aurora safely
  preloadedState: persistedAurora
    ? ({
        aurora: persistedAurora,
      } as any)
    : undefined,

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});


// Persist Aurora slice to localStorage
let auroraPersistTimer: any = null;

store.subscribe(() => {
  if (typeof window === "undefined") return;

  if (auroraPersistTimer) clearTimeout(auroraPersistTimer);

  auroraPersistTimer = setTimeout(() => {
    const state = store.getState();
    saveAuroraStateToStorage(state.aurora);
  }, 200);
});


export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


{/*
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

*/}