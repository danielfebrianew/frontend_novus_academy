// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import accountReducer from './accountSlice';
import sidebarReducer from './sidebarSlice';
import videoGeneratorReducer from './videoGeneratorSlice';
import reportReducer from './reportSlice';
import videoMixerReducer from './videoMixerSlice';
import videoGeneratorProReducer from './videoGeneratorProSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        account: accountReducer,
        sidebar: sidebarReducer,
        report: reportReducer,
        videoGenerator: videoGeneratorReducer,
        videoMixer: videoMixerReducer,
        videoGeneratorPro: videoGeneratorProReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch

