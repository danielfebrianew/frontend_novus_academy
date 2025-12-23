// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import videoGeneratorReducer from './videoGeneratorSlice';
import authReducer from './authSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        videoGenerator: videoGeneratorReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch