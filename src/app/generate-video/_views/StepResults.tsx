// =============================================================================
// STEP 4: RESULTS VIEW
// =============================================================================

"use client";

import { useSelector } from "react-redux";
import { CheckCircle, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VideoGeneratorState } from "../_types";

export function StepResults() {
  const { results } = useSelector(
    (state: { videoGenerator: VideoGeneratorState }) => state.videoGenerator
  );

  const handleCreateNew = () => {
    window.location.reload();
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-10 duration-500">
      {/* Success Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <CheckCircle className="text-green-500" /> Selesai!
          </h2>
          <p className="text-sm text-slate-500">
            Berhasil membuat {results.length} variasi video.
          </p>
        </div>
        <Button onClick={handleCreateNew}>Buat Baru</Button>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {results.map((url: string, idx: number) => (
          <div
            key={idx}
            className="bg-black rounded-lg overflow-hidden aspect-9/16 shadow-lg group relative"
          >
            <video src={url} controls className="w-full h-full object-cover" />
            
            {/* Download Button (hover) */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <a
                href={url}
                download
                target="_blank"
                rel="noreferrer"
                className="bg-white/80 p-2 rounded-full hover:bg-white text-black block"
              >
                <ArrowDown className="w-4 h-4" />
              </a>
            </div>
            
            {/* Variation Label */}
            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              Var #{idx + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
