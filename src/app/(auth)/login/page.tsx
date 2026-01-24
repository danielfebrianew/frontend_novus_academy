"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { apiService } from "@/lib/fetch"
import toast from "react-hot-toast"
import { useDispatch } from "react-redux"
import { setUser } from "@/store/authSlice"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"

const formSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
})

export default function LoginPage() {
  const router = useRouter()
  const dispatch = useDispatch()

  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    localStorage.removeItem("currentUser")
  }, [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    
    const loadingToastId = toast.loading("Sedang memverifikasi akun...")

    try {
      const result = await apiService.post<any>("/api/v1/auth/login", values)

      const user = result.data?.user || result.user

      if (typeof window !== "undefined") {
        localStorage.setItem("currentUser", JSON.stringify(user))
      }

      dispatch(setUser(user))

      toast.dismiss(loadingToastId)
      toast.success(`Selamat datang, ${user.name || 'User'}!`)

      router.push("/generate")
      router.refresh()

    } catch (error: any) {
      toast.dismiss(loadingToastId) 
      
      let errorMessage = "Terjadi kesalahan pada server."

      // ✅ PERBAIKAN: Error handling untuk fetch API
      if (error instanceof Error) {
        // Cek apakah error message dari backend (sudah di-parse di lib/fetch.ts)
        errorMessage = error.message
        
        // Deteksi jenis error berdasarkan message
        if (error.message.includes("401")) {
          errorMessage = "Email atau password salah."
        } else if (error.message.includes("400")) {
          // Gunakan message dari backend jika ada, atau default
          errorMessage = error.message.includes("HTTP error") 
            ? "Email atau password salah." 
            : error.message
        } else if (error.message.includes("429")) {
          errorMessage = "Terlalu banyak percobaan. Coba lagi nanti."
        } else if (error.message.includes("500")) {
          errorMessage = "Server sedang bermasalah. Hubungi admin."
        } else if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
          errorMessage = "Tidak dapat terhubung ke server. Periksa koneksi internet."
        }
      }

      toast.error(errorMessage, {
        duration: 4000,
      })
      
    } finally {
      setIsLoading(false)
    }
  }

  if (!isMounted) {
    return null
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Masuk untuk mengakses dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="admin@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <PasswordInput placeholder="******" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full bg-blue-600 text-white" disabled={isLoading}>
                {isLoading ? "Loading..." : "Masuk"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-gray-600">
            Belum punya akun?{" "}
            <Link href="/auth/register" className="text-blue-600 hover:underline">
              Daftar sekarang
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}