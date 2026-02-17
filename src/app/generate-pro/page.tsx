'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, Sparkles, Video, AlertTriangle, Upload, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import toast, { Toaster } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { VideoResultCard } from './_components/VideoResultCard';
import { CreateProResponse, ProProgressEvent } from './_types';
import { authService } from '@/lib/authService';
import { RootState } from '@/store/store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function GenerateProPage() {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  // Form state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [productTitle, setProductTitle] = useState('');
  const [productDescription, setProductDescription] = useState('');

  // Generation state
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [progressMsg, setProgressMsg] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [resultUrls, setResultUrls] = useState<string[] | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  const cleanupSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupSSE();
    };
  }, [cleanupSSE]);

  const setupSSE = useCallback((jobId: string, token: string | null) => {
    const progressUrl = `${API_URL}/api/v1/generate-pro/progress/${jobId}${token ? `?token=${token}` : ''}`;

    const eventSource = new EventSource(progressUrl);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        const data: ProProgressEvent = parsed.data || parsed;

        if (data.message) {
          setProgressMsg(data.message);
        }

        if (data.progress !== undefined && data.progress !== null) {
          setProgress(data.progress);
        }

        if (data.progress === 100) {
          setResultUrls(data.resultUrls);
          cleanupSSE();
          setIsLoading(false);
          toast.success('Video berhasil dibuat!');
        } else if (data.progress === -1) {
          setGenError(data.failMsg || 'Terjadi kesalahan saat generate video');
          cleanupSSE();
          setIsLoading(false);
          toast.error(data.failMsg || 'Generate video gagal');
        }
      } catch (err) {
        console.error('Error parsing SSE:', err);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
    };
  }, [cleanupSSE]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file terlalu besar (Max 5MB)');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeFile = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageFile || !productTitle.trim() || !productDescription.trim()) {
      toast.error('Semua field wajib diisi', { position: 'top-center' });
      return;
    }

    cleanupSSE();
    setIsLoading(true);
    setProgress(null);
    setProgressMsg('');
    setGeneratedPrompt(null);
    setResultUrls(null);
    setGenError(null);

    const jobId = crypto.randomUUID();
    const token = accessToken || authService.getAccessToken();

    const loadingToast = toast.loading('Mengirim task ke Kie.ai...', { position: 'top-center' });

    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('jobId', jobId);
      formData.append('productTitle', productTitle.trim());
      formData.append('productDescription', productDescription.trim());

      const res = await fetch(`${API_URL}/api/v1/generate-pro/create`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      const data: CreateProResponse = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Gagal mengirim task');
      }

      toast.dismiss(loadingToast);
      toast.success('Task dikirim! Menunggu hasil video...', { position: 'top-center' });

      if (data.data.generatedPrompt) {
        setGeneratedPrompt(data.data.generatedPrompt);
      }

      setupSSE(data.data.jobId || jobId, token);

    } catch (error: unknown) {
      toast.dismiss(loadingToast);
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem';
      toast.error(message, { position: 'top-center' });
      setIsLoading(false);
    }
  };

  const isGenerating = isLoading && progress !== null;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-2">
      <Toaster />

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            Pro Video Generator
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Upload foto produk, masukkan detail produk, dan biarkan AI menghasilkan video berkualitas tinggi secara otomatis.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left: Form ─────────────────────────────────────────────── */}
          <Card className="lg:col-span-1 h-fit shadow-lg border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Konfigurasi
              </CardTitle>
              <CardDescription>Upload foto dan masukkan detail produk.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Image Upload */}
                <div className="space-y-1.5">
                  <Label>
                    Foto Produk <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="imageUpload"
                      onChange={handleFileChange}
                      disabled={isLoading}
                    />
                    <Label
                      htmlFor="imageUpload"
                      className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 transition-all ${
                        imagePreview ? 'border-purple-500 bg-purple-50' : 'border-slate-300'
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {imagePreview ? (
                        <div className="relative w-full h-full">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-lg opacity-80"
                          />
                          {!isLoading && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeFile();
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center py-6">
                          <Upload className="w-8 h-8 text-slate-400 mb-2" />
                          <p className="text-sm text-slate-500">Klik untuk upload foto produk</p>
                          <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP (Max 5MB)</p>
                        </div>
                      )}
                    </Label>
                  </div>
                  <p className="text-xs text-slate-400">
                    Foto ini akan dijadikan referensi visual (first frame) oleh Sora 2.
                  </p>
                </div>

                {/* Product Title */}
                <div className="space-y-1.5">
                  <Label htmlFor="productTitle">
                    Nama Produk <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="productTitle"
                    placeholder="Contoh: Sandal Wanita Hak Tahu 3cm"
                    value={productTitle}
                    onChange={(e) => setProductTitle(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                {/* Product Description */}
                <div className="space-y-1.5">
                  <Label htmlFor="productDescription">
                    Deskripsi Produk <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="productDescription"
                    placeholder="Contoh: Empuk, ringan, outsole anti slip, cocok untuk harian"
                    className="resize-none"
                    rows={4}
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                  <p className="text-xs text-slate-400">
                    Sebutkan fitur dan keunggulan produk secara singkat.
                  </p>
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
                      Generating...
                    </>
                  ) : (
                    'Generate Video'
                  )}
                </Button>

                <p className="text-xs text-center text-slate-400">
                  Rate limit: 2 request per 60 detik
                </p>
              </form>
            </CardContent>
          </Card>

          {/* ── Right: Result / Progress ────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Empty state */}
            {!isLoading && !resultUrls && !genError && !generatedPrompt && (
              <div className="min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-white text-slate-400">
                <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
                <p>Hasil video akan muncul di sini</p>
              </div>
            )}

            {/* Generated Prompt Preview */}
            {generatedPrompt && (
              <Card className="border-purple-200 bg-purple-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-purple-700 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Generated Prompt (GPT-4o Vision)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs text-purple-800 whitespace-pre-wrap font-mono leading-relaxed">
                    {generatedPrompt}
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Progress state */}
            {isLoading && (
              <div className="min-h-[300px] flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 shadow-sm p-8 space-y-6">
                <div className="flex flex-col items-center space-y-3">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-purple-100 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                    </div>
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full animate-ping" />
                  </div>
                  <p className="text-slate-700 font-medium text-center">
                    {progressMsg || 'Menghubungkan ke Kie.ai...'}
                  </p>
                </div>

                {isGenerating && (
                  <div className="w-full max-w-md space-y-2">
                    <Progress value={progress ?? 0} className="h-2" />
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Processing</span>
                      <span>{progress}%</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>Jangan tutup atau refresh halaman ini hingga video selesai dibuat.</span>
                </div>
              </div>
            )}

            {/* Error state */}
            {!isLoading && genError && (
              <div className="min-h-[200px] flex flex-col items-center justify-center bg-red-50 rounded-xl border border-red-200 p-8 space-y-3 animate-in fade-in duration-500">
                <p className="text-red-700 font-semibold">Generate Video Gagal</p>
                <p className="text-red-600 text-sm text-center">{genError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-600 hover:bg-red-100"
                  onClick={() => setGenError(null)}
                >
                  Tutup
                </Button>
              </div>
            )}

            {/* Result */}
            {!isLoading && resultUrls && (
              <VideoResultCard urls={resultUrls} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
