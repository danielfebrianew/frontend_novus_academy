import type { Metadata } from "next"
import { LoginForm } from "./_components/LoginForm"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Login - Novus Academy",
  description: "Masuk ke akun Novus Academy untuk mengakses dashboard.",
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Suspense fallback={<div>Loading login form...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}