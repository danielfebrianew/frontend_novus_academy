// src/components/StoreProvider.tsx
"use client"; // <--- INI KUNCINYA!

import { Provider } from "react-redux";
import { store } from "@/store/store"; // Pastikan path ke store.ts kamu benar

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}