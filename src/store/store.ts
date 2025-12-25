// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import videoGeneratorReducer from './videoGeneratorSlice';
import authReducer from './authSlice';
import accountReducer from './accountSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        account: accountReducer,
        videoGenerator: videoGeneratorReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch