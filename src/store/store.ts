// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import accountReducer from './accountSlice';
import sidebarReducer from './sidebarSlice';
import videoGeneratorReducer from './videoGeneratorSlice';
import reportReducer from './reportSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        account: accountReducer,
        sidebar: sidebarReducer,
        report: reportReducer,
        videoGenerator: videoGeneratorReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch

