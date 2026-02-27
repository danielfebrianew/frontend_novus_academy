// =============================================================================
// STEP 3: GENERATING VIEW (Loading with Progress)
// =============================================================================

"use client";

import { CheckCircle, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function StepGenerating() {
  const handleCreateNew = () => {
    window.location.reload();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-slate-800">
          Script Berhasil Dikirim!
        </h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Video sedang diproses di server. Kamu bisa menutup halaman ini, nanti hasilnya akan muncul di Gallery.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link href="/gallery">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Film className="w-4 h-4 mr-2" />
              Buka Gallery
            </Button>
          </Link>
          <Button variant="outline" onClick={handleCreateNew}>
            Buat Baru
          </Button>
        </div>
      </div>
    </div>
  );
}
