// src/components/common/AuthInitializer.tsx

"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setUser, setAccessToken, setLoading } from "@/store/authSlice";
import { authService } from "@/lib/authService";

export function AuthInitializer() {
  const dispatch = useDispatch();

  useEffect(() => {
    const init = async () => {
      try {
        const user = await authService.refresh();
        const accessToken = authService.getAccessToken();

        if (user) {
          dispatch(setUser(user));
        }
        if (accessToken) {
          dispatch(setAccessToken(accessToken));
        }
      } catch {
        console.log("No valid session");
      } finally {
        dispatch(setLoading(false));
      }
    };

    init();
  }, [dispatch]);

  return null;
}