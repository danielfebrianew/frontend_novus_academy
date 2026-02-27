// =============================================================================
// PRODUCT NAME INPUT COMPONENT
// =============================================================================

"use client";

import { useDispatch, useSelector } from "react-redux";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { setProductName, setProductDescription } from "@/store/videoGeneratorSlice";
import type { VideoGeneratorState } from "../_types";

export function ProductNameInput() {
  const dispatch = useDispatch();
  const { productName, productDescription, loading, step } = useSelector(
    (state: { videoGenerator: VideoGeneratorState }) => state.videoGenerator
  );

  return (
    <div className="max-w-xl mx-auto mb-10 text-center space-y-6">
      <div>
         <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
            AI Video Generator
          </h1>
        <p className="text-slate-500">
          Upload foto produk, crop 9:16, biarkan AI bekerja.
        </p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4 text-left">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700 ml-1">
            Nama Produk / Brand <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            placeholder="Contoh: Sepatu Lari Nike Zoom Air"
            value={productName}
            onChange={(e) => dispatch(setProductName(e.target.value))}
            disabled={loading || step > 1}
            className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700 ml-1">
            Deskripsi Produk <span className="text-red-500">*</span>
          </label>
          <Textarea
            placeholder="Contoh: Serum wajah dengan kandungan Vitamin C 15% dan Niacinamide untuk mencerahkan kulit kusam, memudarkan noda hitam, dan melembapkan."
            value={productDescription}
            onChange={(e) => dispatch(setProductDescription(e.target.value))}
            disabled={loading || step > 1}
            rows={3}
            className="bg-slate-50 border-slate-200 focus-visible:ring-blue-500 resize-none"
          />
          <p className="text-xs text-slate-400 ml-1">
            Jelaskan keunggulan produk agar AI menghasilkan script yang lebih akurat.
          </p>
        </div>
      </div>
    </div>
  );
}
