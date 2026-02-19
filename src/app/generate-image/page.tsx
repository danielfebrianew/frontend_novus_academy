'use client';

import React, { useState } from 'react';
import { Upload, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import toast from 'react-hot-toast';
import { VariantCard } from './_components/variantCard';
import { ApiResponse, GenerationData } from './_types';
import { authService } from '@/lib/authService';

// ─── Category options ─────────────────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  { value: 'fashion', label: 'Fashion / Wearable' },
  { value: 'handheld', label: 'Handheld / Lifestyle' },
  { value: 'food_beverage', label: 'Food & Beverage' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GeneratePage() {
  // Form state
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [category, setCategory] = useState('fashion');
  const [background, setBackground] = useState('');
  const [variantCount, setVariantCount] = useState(6);

  const [modelFile, setModelFile] = useState<File | null>(null);
  const [productFile, setProductFile] = useState<File | null>(null);
  const [modelPreview, setModelPreview] = useState<string | null>(null);
  const [productPreview, setProductPreview] = useState<string | null>(null);

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GenerationData | null>(null);

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'model' | 'product') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file terlalu besar (Max 5MB)');
      return;
    }

    const url = URL.createObjectURL(file);
    if (type === 'model') {
      setModelFile(file);
      setModelPreview(url);
    } else {
      setProductFile(file);
      setProductPreview(url);
    }
  };

  const removeFile = (type: 'model' | 'product') => {
    if (type === 'model') {
      setModelFile(null);
      setModelPreview(null);
    } else {
      setProductFile(null);
      setProductPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productFile || !productName || !productDescription) {
      toast.error('Lengkapi Nama Produk, Deskripsi, dan Foto Produk.', {
        position: 'top-center',
        duration: 4000,
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    const loadingToast = toast.loading('Sedang memproses gambar...', { position: 'top-center' });

    try {
      const formData = new FormData();
      formData.append('productName', productName);
      formData.append('productDescription', productDescription);
      formData.append('category', category);
      formData.append('variantCount', variantCount.toString());
      if (background.trim()) formData.append('background', background.trim());
      formData.append('productImage', productFile);
      if (modelFile) formData.append('modelImage', modelFile);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const token = authService.getAccessToken();

      const res = await fetch(`${API_URL}/api/v1/generate-image`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      const data: ApiResponse = await res.json();

      if (res.ok && data.statusCode === 201) {
        setResult(data.data);
        toast.success(`Berhasil! ${data.data.successfulVariants} varian dibuat.`, {
          id: loadingToast,
        });
      } else {
        throw new Error(data.message || 'Gagal melakukan generate image');
      }
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan sistem', {
        id: loadingToast,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (url: string, variantNumber: number) => {
    const filename = `variant-${variantNumber}.png`;
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download dimulai!');
  };

  // Estimasi waktu berdasarkan jumlah varian
  const estimatedTime = Math.round(variantCount * 12);

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-2">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            AI Product Photography
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Upload foto produk Anda, biarkan AI menggabungkannya menjadi varian foto studio profesional secara instan.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left: Form ────────────────────────────────────────────── */}
          <Card className="lg:col-span-1 h-fit shadow-lg border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Konfigurasi
              </CardTitle>
              <CardDescription>Masukkan detail produk Anda di sini.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Nama Produk */}
                <div className="space-y-1.5">
                  <Label htmlFor="productName">
                    Nama Produk <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="productName"
                    placeholder="Contoh: Jacket Canvas Polos"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    required
                  />
                </div>

                {/* Deskripsi Produk */}
                <div className="space-y-1.5">
                  <Label htmlFor="productDescription">
                    Deskripsi Produk <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="productDescription"
                    placeholder="Contoh: Jaket canvas polos, bahan ringan dan breathable..."
                    className="resize-none"
                    rows={3}
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    required
                  />
                </div>

                {/* Kategori */}
                <div className="space-y-1.5">
                  <Label htmlFor="category">
                    Kategori Produk <span className="text-red-500">*</span>
                  </Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* ✅ Variant Count Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="variantCount">Jumlah Varian</Label>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 font-semibold">
                      {variantCount} {variantCount === 1 ? 'gambar' : 'gambar'}
                    </Badge>
                  </div>
                  <Slider
                    id="variantCount"
                    min={1}
                    max={6}
                    step={1}
                    value={[variantCount]}
                    onValueChange={(value) => setVariantCount(value[0])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                    <span>5</span>
                    <span>6</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Estimasi waktu: ~{estimatedTime} detik
                  </p>
                </div>

                {/* Background / Atmosphere */}
                <div className="space-y-1.5">
                  <Label htmlFor="background">
                    Background <span className="text-slate-400 font-normal text-xs">(opsional)</span>
                  </Label>
                  <Input
                    id="background"
                    placeholder="Kosongkan untuk auto-pick"
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                  />
                  <p className="text-xs text-slate-400">
                    Kalau kosong, AI akan pilih dari: plain white, wine red, atau light blue — disesuaikan warna produk.
                  </p>
                </div>

                {/* Upload: Model + Produk */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Model — optional */}
                  <div className="space-y-1.5">
                    <Label>
                      Foto Model <span className="text-slate-400 font-normal text-xs">(opsional)</span>
                    </Label>
                    <div className="relative group cursor-pointer">
                      <Input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="modelUpload"
                        onChange={(e) => handleFileChange(e, 'model')}
                      />
                      <Label
                        htmlFor="modelUpload"
                        className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 transition-all ${modelPreview ? 'border-purple-500 bg-purple-50' : 'border-slate-300'
                          }`}
                      >
                        {modelPreview ? (
                          <div className="relative w-full h-full">
                            <img src={modelPreview} alt="Model" className="w-full h-full object-cover rounded-lg opacity-80" />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeFile('model');
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center pt-5 pb-6">
                            <Upload className="w-6 h-6 text-slate-400 mb-1" />
                            <p className="text-xs text-slate-500 text-center">Upload Model</p>
                          </div>
                        )}
                      </Label>
                    </div>
                  </div>

                  {/* Produk — required */}
                  <div className="space-y-1.5">
                    <Label>
                      Foto Produk <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative group cursor-pointer">
                      <Input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="productUpload"
                        onChange={(e) => handleFileChange(e, 'product')}
                      />
                      <Label
                        htmlFor="productUpload"
                        className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 transition-all ${productPreview ? 'border-purple-500 bg-purple-50' : 'border-slate-300'
                          }`}
                      >
                        {productPreview ? (
                          <div className="relative w-full h-full">
                            <img src={productPreview} alt="Product" className="w-full h-full object-cover rounded-lg opacity-80" />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeFile('product');
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center pt-5 pb-6">
                            <ImageIcon className="w-6 h-6 text-slate-400 mb-2" />
                            <p className="text-xs text-slate-500 text-center">Upload Produk</p>
                          </div>
                        )}
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating (~{estimatedTime}s)...
                    </>
                  ) : (
                    <>
                      Generate {variantCount} {variantCount === 1 ? 'Image' : 'Images'}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* ── Right: Results ──────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Empty state */}
            {!isLoading && !result && (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-white text-slate-400">
                <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
                <p>Hasil generate akan muncul di sini</p>
              </div>
            )}

            {/* Skeleton loader - dynamic based on variantCount */}
            {isLoading && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(variantCount)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-[300px] w-full rounded-xl bg-slate-200" />
                    <Skeleton className="h-4 w-3/4 bg-slate-200" />
                  </div>
                ))}
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="space-y-6 animate-in fade-in duration-500">
                {/* Summary bar */}
                <div className="bg-white p-4 rounded-lg shadow-sm border space-y-3">
                  {/* Row 1: title + badges */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Generation Complete</h2>
                      <p className="text-sm text-slate-500">
                        Waktu proses: {(result.processingTime / 1000).toFixed(1)} detik
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        {result.successfulVariants} Sukses
                      </Badge>
                      {result.failedVariants > 0 && (
                        <Badge variant="destructive">{result.failedVariants} Gagal</Badge>
                      )}
                    </div>
                  </div>

                  {/* Row 2: product meta */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                    <Badge variant="outline" className="text-slate-600">
                      {result.productName}
                    </Badge>
                    <Badge variant="outline" className="text-slate-500 capitalize">
                      {result.category.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline" className="text-slate-500">
                      {result.background}
                    </Badge>
                    <span className="text-xs text-slate-400 self-center ml-auto">
                      Job: {result.jobId}
                    </span>
                  </div>
                </div>

                {/* Variant grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {result.variants.map((variant) => (
                    <VariantCard
                      key={variant.variantNumber}
                      variant={variant}
                      onDownload={handleDownload}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}