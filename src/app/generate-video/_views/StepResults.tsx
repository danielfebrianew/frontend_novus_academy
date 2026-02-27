// =============================================================================
// STEP 4: RESULTS VIEW
// =============================================================================

"use client";

import { CheckCircle, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function StepResults() {
  const handleCreateNew = () => {
    window.location.reload();
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-10 duration-500">
      {/* Success Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <CheckCircle className="text-green-500" /> Video Sedang Diproses!
          </h2>
          <p className="text-sm text-slate-500">
            Video kamu sedang dibuat di background.
          </p>
        </div>
        <Button onClick={handleCreateNew}>Buat Baru</Button>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <Film className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800">
          Kalau video sudah jadi, hasilnya akan muncul di Gallery
        </h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Proses pembuatan video membutuhkan waktu beberapa menit. Kamu bisa menutup halaman ini dan cek hasilnya nanti di halaman Gallery.
        </p>
        <Link href="/gallery">
          <Button variant="outline" className="mt-2 border-blue-300 text-blue-600 hover:bg-blue-100">
            Buka Gallery
          </Button>
        </Link>
      </div>
    </div>
  );
}
