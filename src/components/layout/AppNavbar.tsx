"use client"

import Link from "next/link"
import { useSelector } from "react-redux"
import { Button } from "@/components/ui/button"
import type { RootState } from "@/store/store"

export function Navbar() {
  const user = useSelector((state: RootState) => state.auth?.user)

  return (
    <nav className="flex items-center h-16 px-6 border-b bg-white w-full">
      <Link href="/">
        <h1 className="text-2xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent cursor-pointer">
          Novus Next Gen
        </h1>
      </Link>

      <div className="flex items-center ml-auto gap-4">
        {!user && (
          <>
            <Link href="/login">
              <Button variant="ghost" size="sm">Masuk</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Daftar</Button>
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}