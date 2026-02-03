// =============================================================================
// IMAGE PREVIEW GRID COMPONENT
// =============================================================================

"use client";

import { Trash2 } from "lucide-react";
import { createPreviewUrl } from "../_utils/fileUtils";

interface ImagePreviewGridProps {
  files: File[];
  onRemove: (index: number) => void;
}

export function ImagePreviewGrid({ files, onRemove }: ImagePreviewGridProps) {
  if (files.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
      {files.map((file, idx) => (
        <div
          key={idx}
          className="relative group aspect-9/16 bg-white rounded-lg overflow-hidden border border-slate-200 shadow-sm"
        >
          <img
            src={createPreviewUrl(file)}
            alt={`Preview ${idx + 1}`}
            className="w-full h-full object-cover"
          />
          <button
            onClick={() => onRemove(idx)}
            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 shadow-sm"
            type="button"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <div className="absolute bottom-0 w-full bg-linear-to-t from-black/60 to-transparent text-white text-[10px] p-2 text-center pt-4">
            Img {idx + 1}
          </div>
        </div>
      ))}
    </div>
  );
}
