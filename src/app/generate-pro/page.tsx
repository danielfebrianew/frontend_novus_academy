'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, Sparkles, Video, AlertTriangle, Upload, ImageIcon, Send, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import toast from 'react-hot-toast';
import { VideoResultCard } from './_components/VideoResultCard';
import { CreateProResponse, ProProgressEvent, StatusResponse } from './_types';
import { authService } from '@/lib/authService';
import apiService from '@/lib/fetch';
import { useActiveJob } from '@/hooks/useActiveJob';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function GenerateProPage() {
  const { activeJob, isCheckingActiveJob, clearActiveJob } = useActiveJob();

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
  const [taskId, setTaskId] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const clearActiveJobRef = useRef(clearActiveJob);
  clearActiveJobRef.current = clearActiveJob;

  const cleanupSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupSSE();
    };
  }, [cleanupSSE]);

  const queryFallbackStatus = useCallback(async (fallbackTaskId: string) => {
    try {
      const data = await apiService.get<StatusResponse>(`/api/v1/generate-pro/status/${fallbackTaskId}`);
      const { state, resultUrls, failMsg } = data.data;

      if (state === 'success') {
        setResultUrls(resultUrls);
        setProgress(100);
        setIsLoading(false);
        clearActiveJobRef.current();
        toast.success('Video berhasil dibuat!');
      } else if (state === 'fail') {
        setGenError(failMsg || 'Generate video gagal');
        setIsLoading(false);
        clearActiveJobRef.current();
        toast.error(failMsg || 'Generate video gagal');
      } else {
        // still processing — retry after 5s
        setProgressMsg('Menunggu hasil video (polling)...');
        fallbackTimerRef.current = setTimeout(() => {
          queryFallbackStatus(fallbackTaskId);
        }, 5000);
      }
    } catch (err) {
      console.error('Fallback status error:', err);
      setGenError('Gagal mengecek status video');
      setIsLoading(false);
    }
  }, []);

  const setupSSE = useCallback((jobId: string, token: string | null, fallbackTaskId: string | null) => {
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
          clearActiveJobRef.current();
          toast.success('Video berhasil dibuat!');
        } else if (data.progress === -1) {
          setGenError(data.failMsg || 'Terjadi kesalahan saat generate video');
          cleanupSSE();
          setIsLoading(false);
          clearActiveJobRef.current();
          toast.error(data.failMsg || 'Generate video gagal');
        }
      } catch (err) {
        console.error('Error parsing SSE:', err);
      }
    };

    eventSource.onerror = () => {
      if (eventSource.readyState === EventSource.CLOSED) {
        console.error('SSE connection closed, falling back to status polling');
        cleanupSSE();
        if (fallbackTaskId) {
          queryFallbackStatus(fallbackTaskId);
        } else {
          setGenError('Koneksi SSE terputus dan tidak ada fallback tersedia');
          setIsLoading(false);
        }
      }
    };
  }, [cleanupSSE, queryFallbackStatus]);

  // Active job reconnection
  const activeJobReconnectedRef = useRef(false);

  useEffect(() => {
    if (isCheckingActiveJob) return;
    if (!activeJob) return;
    if (activeJobReconnectedRef.current) return;

    activeJobReconnectedRef.current = true;

    setIsLoading(true);
    setProgress(0);
    setProgressMsg('Menghubungkan ulang ke job aktif...');
    setTaskId(activeJob.taskId);

    setupSSE(activeJob.jobId, authService.getAccessToken(), activeJob.taskId);
  }, [isCheckingActiveJob, activeJob, setupSSE]);

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
    if (isLoading) return;

    if (!imageFile || !productTitle.trim() || !productDescription.trim()) {
      toast.error('Semua field wajib diisi', { position: 'top-center' });
      return;
    }

    cleanupSSE();
    lastPositiveProgressRef.current = 0;
    setIsLoading(true);
    setProgress(null);
    setProgressMsg('');
    setGeneratedPrompt(null);
    setResultUrls(null);
    setGenError(null);

    const jobId = crypto.randomUUID();

    const loadingToast = toast.loading('Mengirim task ke Ai Generator...', { position: 'top-center' });

    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('jobId', jobId);
      formData.append('productTitle', productTitle.trim());
      formData.append('productDescription', productDescription.trim());

      const data = await apiService.upload<CreateProResponse>('/api/v1/generate-pro/create', formData);

      toast.dismiss(loadingToast);
      toast.success('Task dikirim! Menunggu hasil video...', { position: 'top-center' });

      if (data.data.generatedPrompt) {
        setGeneratedPrompt(data.data.generatedPrompt);
      }

      setTaskId(data.data.taskId);
      setupSSE(data.data.jobId || jobId, authService.getAccessToken(), data.data.taskId);

    } catch (error: unknown) {
      toast.dismiss(loadingToast);
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem';
      toast.error(message, { position: 'top-center' });
      setIsLoading(false);
    }
  };

  const isGenerating = isLoading && progress !== null;
  const showStepper = isLoading || resultUrls !== null || genError !== null;

  const lastPositiveProgressRef = useRef(0);
  if (progress !== null && progress > 0) {
    lastPositiveProgressRef.current = progress;
  }

  const STEPS = [
    { label: 'Upload Gambar', threshold: 5, icon: Upload },
    { label: 'Generate Prompt', threshold: 15, icon: Sparkles },
    { label: 'Submit ke Ai Generator', threshold: 30, icon: Send },
    { label: 'Rendering Video', threshold: 40, icon: Video },
    { label: 'Selesai', threshold: 100, icon: CheckCircle2 },
  ];

  const getStepStatus = (threshold: number, index: number): 'pending' | 'active' | 'completed' | 'failed' => {
    const p = progress ?? 0;
    const isFailed = p === -1;
    const effectiveProgress = isFailed ? lastPositiveProgressRef.current : p;

    if (isFailed) {
      if (effectiveProgress >= threshold) return 'completed';
      // The first pending step after last completed = the one that failed
      const prevThreshold = index > 0 ? STEPS[index - 1].threshold : 0;
      if (effectiveProgress >= prevThreshold && effectiveProgress < threshold) return 'failed';
      return 'pending';
    }

    if (effectiveProgress >= threshold) return 'completed';

    // Active = first step not yet completed
    const prevThreshold = index > 0 ? STEPS[index - 1].threshold : 0;
    if (effectiveProgress >= prevThreshold) return 'active';

    return 'pending';
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-2">

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
              {isLoading && activeJobReconnectedRef.current && (
                <div className="mb-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
                  <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />
                  <span>Anda memiliki generasi yang sedang berjalan. Harap tunggu hingga selesai.</span>
                </div>
              )}
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

            {/* Status Stepper */}
            {showStepper && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between">
                  {STEPS.map((step, index) => {
                    const status = getStepStatus(step.threshold, index);
                    const StepIcon = status === 'failed' ? XCircle : status === 'completed' ? CheckCircle2 : step.icon;

                    return (
                      <React.Fragment key={step.label}>
                        {/* Step */}
                        <div className="flex flex-col items-center gap-1.5 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                              status === 'completed'
                                ? 'bg-green-100 text-green-600'
                                : status === 'active'
                                ? 'bg-purple-100 text-purple-600 animate-pulse'
                                : status === 'failed'
                                ? 'bg-red-100 text-red-600'
                                : 'bg-slate-100 text-slate-300'
                            }`}
                          >
                            <StepIcon className="w-5 h-5" />
                          </div>
                          <span
                            className={`text-[10px] font-medium text-center leading-tight ${
                              status === 'completed'
                                ? 'text-green-600'
                                : status === 'active'
                                ? 'text-purple-600'
                                : status === 'failed'
                                ? 'text-red-600'
                                : 'text-slate-400'
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>

                        {/* Connector line */}
                        {index < STEPS.length - 1 && (
                          <div
                            className={`flex-1 h-0.5 mx-1 rounded transition-all ${
                              getStepStatus(STEPS[index + 1].threshold, index + 1) === 'completed' ||
                              getStepStatus(STEPS[index + 1].threshold, index + 1) === 'active' ||
                              getStepStatus(STEPS[index + 1].threshold, index + 1) === 'failed'
                                ? status === 'failed' || getStepStatus(STEPS[index + 1].threshold, index + 1) === 'failed'
                                  ? 'bg-red-200'
                                  : 'bg-green-300'
                                : 'bg-slate-200'
                            }`}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
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
                    {progressMsg || 'Menghubungkan ke Ai Generator...'}
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
                  <span>Anda bisa meninggalkan halaman ini. Kami akan mengirim notifikasi saat selesai.</span>
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
