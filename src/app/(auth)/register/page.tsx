import type { Metadata } from "next"
import { RegisterForm } from "./_components/RegisterForm"

export const metadata: Metadata = {
  title: "Register - Novus Academy",
  description: "Buat akun Novus Academy untuk mulai generate AI.",
}

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <RegisterForm />
    </div>
  )
}
