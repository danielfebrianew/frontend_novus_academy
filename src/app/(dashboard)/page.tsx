import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50">
        <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
          Buat Video & Teks AI <br />
          <span className="text-blue-600">Dalam Hitungan Detik</span>
        </h2>
        
        <p className="text-xl text-gray-600 max-w-2xl mb-8">
          Ubah ide kreatifmu menjadi konten visual yang menakjubkan dengan kekuatan Artificial Intelligence. Cepat, mudah, dan otomatis.
        </p>

        <div className="flex gap-4">
          <Link href="/register">
            <Button size="lg" className="h-12 px-8 text-lg">
              Mulai Gratis
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="h-12 px-8 text-lg">
              Saya Sudah Punya Akun
            </Button>
          </Link>
        </div>

      </main>

      <footer className="p-6 text-center text-gray-500 border-t">
        &copy; 2026 Novus Next Gen. All rights reserved.
      </footer>
    </div>
  )
}