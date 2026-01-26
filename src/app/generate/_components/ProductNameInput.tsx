// =============================================================================
// PRODUCT NAME INPUT COMPONENT
// =============================================================================

"use client";

import { useDispatch, useSelector } from "react-redux";
import { Input } from "@/components/ui/input";
import { setProductName } from "@/store/videoGeneratorSlice";
import type { VideoGeneratorState } from "../_types";

export function ProductNameInput() {
  const dispatch = useDispatch();
  const { productName, loading, step } = useSelector(
    (state: { videoGenerator: VideoGeneratorState }) => state.videoGenerator
  );

  return (
    <div className="max-w-xl mx-auto mb-10 text-center space-y-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">
          AI Video Generator
        </h1>
        <p className="text-slate-500">
          Upload foto produk, crop 9:16, biarkan AI bekerja.
        </p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2 text-left">
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
    </div>
  );
}
