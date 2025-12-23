"use client"

import { useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import { setUser } from "@/store/authSlice"

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch()

  useEffect(() => {
    // Cek user dari localStorage (buat data tampilan doang)
    const storedUser = localStorage.getItem("currentUser")

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        dispatch(setUser(user))
      } catch (error) {
        console.error("Parse user error", error)
        localStorage.removeItem("currentUser")
      }
    }
  }, [dispatch])

  return <>{children}</>
}