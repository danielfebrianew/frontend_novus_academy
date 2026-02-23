"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  ImagePlus,
  Loader2,
  X,
  Crop,
  Check,
  Move,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CropData, ImageFile, StepUploadProps } from "../_types";
import { TARGET_RATIO } from "../_constants";
import { ProductNameInput } from "../_components";

// =============================================================================
// CROP MODAL COMPONENT
// =============================================================================
function CropModal({
  image,
  onSave,
  onClose,
}: {
  image: ImageFile;
  onSave: (croppedUrl: string, cropData: CropData) => void;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });

  // Load image dimensions
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });

      // Calculate initial position to center the crop
      const imgRatio = img.width / img.height;
      if (imgRatio > TARGET_RATIO) {
        setPosition({ x: -(img.width / img.height - TARGET_RATIO) * 50, y: 0 });
      } else {
        setPosition({ x: 0, y: -(1 / imgRatio - 1 / TARGET_RATIO) * 50 });
      }
    };
    img.src = image.originalUrl;
  }, [image.originalUrl]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleSave = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();

    img.onload = () => {
      const containerWidth = 270; // Preview width
      const containerHeight = 480; // Preview height (9:16)

      // Calculate the visible area in image coordinates
      const displayScale =
        Math.max(containerWidth / img.width, containerHeight / img.height) *
        scale;

      const imgDisplayWidth = img.width * displayScale;
      const imgDisplayHeight = img.height * displayScale;

      // Calculate source rectangle
      const sourceX =
        (-position.x + (containerWidth - imgDisplayWidth) / 2) / displayScale;
      const sourceY =
        (-position.y + (containerHeight - imgDisplayHeight) / 2) / displayScale;
      const sourceW = containerWidth / displayScale;
      const sourceH = containerHeight / displayScale;

      // High quality output
      canvas.width = 1080;
      canvas.height = 1920;

      ctx.drawImage(
        img,
        Math.max(0, sourceX),
        Math.max(0, sourceY),
        Math.min(sourceW, img.width),
        Math.min(sourceH, img.height),
        0,
        0,
        1080,
        1920
      );

      onSave(canvas.toDataURL("image/jpeg", 0.92), {
        x: position.x,
        y: position.y,
        scale,
      });
    };
    img.src = image.originalUrl;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl border border-zinc-700/50">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Sesuaikan Crop
            </h3>
            <p className="text-sm text-zinc-400 mt-0.5">
              Geser & zoom untuk mengatur posisi
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Crop Area */}
        <div
          ref={containerRef}
          className="relative mx-auto overflow-hidden rounded-xl cursor-move bg-zinc-950"
          style={{ width: 270, height: 480 }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Image */}
          <div
            className="absolute transition-transform duration-75"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: "center",
            }}
          >
            <img
              src={image.originalUrl}
              alt="Crop preview"
              className="max-w-none"
              style={{
                width:
                  imageDimensions.width > imageDimensions.height
                    ? "auto"
                    : "270px",
                height:
                  imageDimensions.width > imageDimensions.height
                    ? "480px"
                    : "auto",
              }}
              draggable={false}
            />
          </div>

          {/* Grid Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="w-full h-full grid grid-cols-3 grid-rows-3">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="border border-white/10" />
              ))}
            </div>
          </div>

          {/* Drag indicator */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
            <div className="bg-black/50 backdrop-blur-sm rounded-full p-3">
              <Move className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
            className="p-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors"
          >
            <ZoomOut className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-full">
            <span className="text-sm text-zinc-400 font-medium w-16 text-center">
              {Math.round(scale * 100)}%
            </span>
          </div>

          <button
            onClick={() => setScale((s) => Math.min(3, s + 0.1))}
            className="p-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors"
          >
            <ZoomIn className="w-5 h-5 text-white" />
          </button>

          <button
            onClick={() => {
              setScale(1);
              setPosition({ x: 0, y: 0 });
            }}
            className="p-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors ml-2"
          >
            <RotateCcw className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            Batal
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            <Check className="w-4 h-4 mr-2" />
            Simpan
          </Button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// IMAGE CARD COMPONENT
// =============================================================================
function ImageCard({
  image,
  index,
  onRemove,
  onCrop,
  isProcessing,
}: {
  image: ImageFile;
  index: number;
  onRemove: () => void;
  onCrop: () => void;
  isProcessing: boolean;
}) {
  return (
    <div
      className="group relative animate-in fade-in slide-in-from-bottom-4 duration-300"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Card Container */}
      <div className="relative aspect-9/16 rounded-2xl overflow-hidden bg-zinc-900 shadow-lg ring-1 ring-white/10">
        {/* Image */}
        <img
          src={image.croppedUrl}
          alt={`Upload ${index + 1}`}
          className="w-full h-full object-cover"
        />

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {/* Top Actions */}
          <div className="absolute top-3 right-3 flex gap-2">
            <button
              onClick={onRemove}
              className="p-2 bg-red-500/90 hover:bg-red-500 backdrop-blur-sm rounded-full transition-all duration-200 shadow-lg"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Bottom Actions */}
          <div className="absolute bottom-3 inset-x-3">
            <button
              onClick={onCrop}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl transition-all duration-200 border border-white/20"
            >
              <Crop className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">
                Sesuaikan Crop
              </span>
            </button>
          </div>
        </div>

        {/* Index Badge */}
        <div className="absolute top-3 left-3 w-7 h-7 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
          <span className="text-xs font-semibold text-white">{index + 1}</span>
        </div>

        {/* Auto-cropped indicator */}
        <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/90 backdrop-blur-sm rounded-full">
            <Check className="w-3 h-3 text-white" />
            <span className="text-xs font-medium text-white">9:16</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// AUTO-CROP UTILITY (Included for completeness)
// =============================================================================
function autoCropToRatio(
  imageUrl: string,
  ratio: number = TARGET_RATIO
): Promise<{ croppedUrl: string; cropData: CropData }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const imgRatio = img.width / img.height;
      let sourceX = 0,
        sourceY = 0,
        sourceW = img.width,
        sourceH = img.height;

      if (imgRatio > ratio) {
        sourceW = img.height * ratio;
        sourceX = (img.width - sourceW) / 2;
      } else {
        sourceH = img.width / ratio;
        sourceY = (img.height - sourceH) / 2;
      }

      const outputH = Math.min(1920, sourceH);
      const outputW = outputH * ratio;
      canvas.width = outputW;
      canvas.height = outputH;

      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceW,
        sourceH,
        0,
        0,
        outputW,
        outputH
      );

      resolve({
        croppedUrl: canvas.toDataURL("image/jpeg", 0.92),
        cropData: { x: sourceX / img.width, y: sourceY / img.height, scale: 1 },
      });
    };
    img.src = imageUrl;
  });
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export function StepUpload({
  fileInputRef,
  onFilesReady,
  onProcessImages,
  isLoading,
}: StepUploadProps) {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [cropModalImage, setCropModalImage] = useState<ImageFile | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // ... [handleFiles logic remains the same] ...
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) =>
      f.type.startsWith("image/")
    );

    for (const file of fileArray) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const originalUrl = URL.createObjectURL(file);

      const newImage: ImageFile = {
        id,
        file,
        originalUrl,
        croppedUrl: originalUrl,
        cropData: { x: 0, y: 0, scale: 1 },
      };

      setImages((prev) => [...prev, newImage]);
      setProcessingIds((prev) => new Set(prev).add(id));

      const { croppedUrl, cropData } = await autoCropToRatio(originalUrl);

      setImages((prev) =>
        prev.map((img) =>
          img.id === id ? { ...img, croppedUrl, cropData } : img
        )
      );

      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, []);

  useEffect(() => {
    const convertToFiles = async () => {
      const files = await Promise.all(
        images.map(async (img) => {
          const res = await fetch(img.croppedUrl);
          const blob = await res.blob();
          return new File([blob], img.file.name, { type: "image/jpeg" });
        })
      );
      onFilesReady(files);
    };

    if (images.length > 0) convertToFiles();
    else onFilesReady([]);
  }, [images, onFilesReady]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
    e.target.value = "";
  };
  const removeImage = (id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) URL.revokeObjectURL(img.originalUrl);
      return prev.filter((i) => i.id !== id);
    });
  };
  const handleCropSave = (croppedUrl: string, cropData: CropData) => {
    if (!cropModalImage) return;
    setImages((prev) =>
      prev.map((img) =>
        img.id === cropModalImage.id ? { ...img, croppedUrl, cropData } : img
      )
    );
    setCropModalImage(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="w-full">
        <ProductNameInput />
      </div>
      <div
        className={`
          relative group cursor-pointer
          rounded-2xl border-2 border-dashed transition-all duration-300
          flex flex-col items-center justify-center py-16 px-6 text-center
          ${isDragOver
            ? "border-blue-500 bg-blue-50"
            : "border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400"
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* The Clickable Input Overlay */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleInputChange}
          disabled={isLoading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />

        <div className="mb-4 p-4 rounded-full bg-white shadow-sm ring-1 ring-slate-100 pointer-events-none">
          {isLoading ? (
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          ) : (
            <ImagePlus className="w-8 h-8 text-blue-600" />
          )}
        </div>

        <h3 className="text-lg font-semibold text-slate-900 mb-1 pointer-events-none">
          {isDragOver ? "Lepaskan file disini" : "Upload Foto Produk"}
        </h3>
        <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto pointer-events-none">
          Format JPG, PNG, WebP. Otomatis crop ke rasio{" "}
          <span className="font-medium text-blue-600">9:16</span>
        </p>

        {/* Visual-only button (Click passes through to input above) */}
        <div className="pointer-events-none">
          <Button
            variant="outline"
            type="button" // Important: prevents form submission
            className="bg-white border-slate-200 text-slate-700 shadow-sm"
          >
            Pilih Gambar
          </Button>
        </div>
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              Siap Upload ({images.length})
            </h3>

            <Button
              onClick={onProcessImages}
              disabled={isLoading || processingIds.size > 0}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Memproses...
                </>
              ) : (
                <>
                  Lanjut
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((image, index) => (
              <ImageCard
                key={image.id}
                image={image}
                index={index}
                onRemove={() => removeImage(image.id)}
                onCrop={() => setCropModalImage(image)}
                isProcessing={processingIds.has(image.id)}
              />
            ))}

            {/* Add More Card - FIXED: Overlay Input Method */}
            <div className="relative group cursor-pointer aspect-9/16 rounded-xl border-2 border-dashed border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition-all flex flex-col items-center justify-center gap-2">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleInputChange}
                disabled={isLoading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-10 h-10 rounded-lg bg-white shadow-sm ring-1 ring-slate-100 flex items-center justify-center pointer-events-none">
                <ImagePlus className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
              </div>
              <span className="text-sm font-medium text-slate-500 group-hover:text-slate-700 pointer-events-none">
                Tambah
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Crop Modal */}
      {cropModalImage && (
        <CropModal
          image={cropModalImage}
          onSave={handleCropSave}
          onClose={() => setCropModalImage(null)}
        />
      )}
    </div>
  );
}