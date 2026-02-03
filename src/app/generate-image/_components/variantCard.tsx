"use client";

import { useState } from "react";
import { Download, X, ChevronDown, ExternalLink } from "lucide-react";
import { Card, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageVariant } from "../_types/index";

interface VariantCardProps {
  variant: ImageVariant; 
  onDownload: (url: string, num: number) => void;
}

export function VariantCard({ variant, onDownload }: VariantCardProps) {
  const [showPrompt, setShowPrompt] = useState(false);

  // Convert string date dari API ke object Date JS
  const formattedTime = new Date(variant.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Card className="overflow-hidden group relative border-0 shadow-md flex flex-col h-full">
      {/* ─── Image Section ─── */}
      {variant.imageUrl ? (
        <div className="relative aspect-[9/16] bg-slate-100">
          <img
            src={variant.imageUrl}
            alt={`Variant ${variant.variantNumber}`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          
          {/* Overlay Buttons */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => window.open(variant.imageUrl!, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-1" /> View
            </Button>
            <Button
              size="sm"
              className="bg-white text-black hover:bg-slate-200"
              onClick={() => onDownload(variant.imageUrl!, variant.variantNumber)}
            >
              <Download className="w-4 h-4 mr-1" /> Save
            </Button>
          </div>
        </div>
      ) : (
        /* Error State */
        <div className="aspect-[9/16] flex items-center justify-center bg-red-50 text-red-500 flex-col p-4 text-center border-b">
          <X className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-sm font-medium">Gagal Generate</p>
          <p className="text-xs mt-1 text-red-400 break-words w-full px-2">
            {variant.error || "Unknown error"}
          </p>
        </div>
      )}

      {/* ─── Footer Section ─── */}
      <CardFooter className="p-3 bg-white flex flex-col items-start gap-3 flex-grow">
        
        {/* Title & Meta */}
        <div className="w-full flex justify-between items-start gap-2">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              Variant #{variant.variantNumber}
            </span>
            <span className="text-sm font-semibold text-slate-800 line-clamp-1" title={variant.title}>
              {variant.title}
            </span>
          </div>
          <Badge variant="outline" className="text-[10px] text-slate-400 font-normal shrink-0">
            {formattedTime}
          </Badge>
        </div>

        {/* Prompt Toggle (Selalu render tombol karena di type kamu prompt wajib ada string) */}
        <div className="w-full mt-auto">
          <button
            onClick={() => setShowPrompt(!showPrompt)}
            className="w-full flex items-center justify-between text-xs text-purple-600 hover:text-purple-800 transition-colors py-1 group/btn"
          >
            <span className="font-medium group-hover/btn:underline">
              {showPrompt ? 'Sembunyikan prompt' : 'Lihat prompt'}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${showPrompt ? 'rotate-180' : ''}`}
            />
          </button>

          {showPrompt && (
            <div className="mt-2 text-xs text-slate-600 bg-slate-50 rounded-md p-2.5 leading-relaxed border border-slate-100 animate-in slide-in-from-top-1 fade-in duration-200 max-h-32 overflow-y-auto custom-scrollbar">
              {variant.prompt}
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}