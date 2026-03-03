// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import sidebarReducer from './sidebarSlice';
import videoGeneratorReducer from './videoGeneratorSlice';
import videoGeneratorProReducer from './videoGeneratorProSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        sidebar: sidebarReducer,
        videoGenerator: videoGeneratorReducer,
        videoGeneratorPro: videoGeneratorProReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch

