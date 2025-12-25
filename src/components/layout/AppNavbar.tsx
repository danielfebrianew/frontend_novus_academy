"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Navbar() {
  return (
    <nav className="flex items-center h-16 px-6 border-b bg-white w-full fixed top-0 z-50">
      {/* KIRI: LOGO */}
      <Link href="/">
        <h1 className="text-2xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent cursor-pointer">
          Novus Next Gen
        </h1>
      </Link>

      {/* KANAN: MENU AUTH (SELALU MUNCUL) */}
      <div className="flex items-center ml-auto gap-4">
        
        {/* Tombol Masuk */}
        <Link href="/login">
            <Button variant="ghost" size="sm">
                Masuk
            </Button>
        </Link>

        {/* Tombol Daftar */}
        <Link href="/register">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                Daftar
            </Button>
        </Link>
        
      </div>
    </nav>
  )
}