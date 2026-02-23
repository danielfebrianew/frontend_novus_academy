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
import { CreateProResponse, ProProgressEvent, StatusResponse, KieJobRecord } from './_types';
import { authService } from '@/lib/authService';
import apiService from '@/lib/fetch';
import { useActiveJob } from '@/hooks/useActiveJob';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import {
  setProLoading, setProTaskId, setProProgressMsg, setProSimulatedProgress,
  setProGeneratedPrompt, setProResultUrls, setProGenError,
  setProProductTitle, setProProductDescription, setProImagePreview, resetPro,
} from '@/store/videoGeneratorProSlice';

const COLORS = {
  deepest: 'var(--background)',
  dark: 'var(--card)',
  forest: 'var(--border)',
  medium: 'var(--muted-foreground)',
  sage: 'var(--primary)',
  mint: 'var(--foreground)',
  white: 'var(--primary-foreground)',
} as const;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function GenerateProPage() {
  const { activeJob, isCheckingActiveJob, clearActiveJob } = useActiveJob();

  // Form state — imageFile stays local (File object not serializable)
  const [imageFile, setImageFile] = useState<File | null>(null);
  const productTitle = useSelector((s: RootState) => s.videoGeneratorPro.productTitle);
  const productDescription = useSelector((s: RootState) => s.videoGeneratorPro.productDescription);
  const imagePreview = useSelector((s: RootState) => s.videoGeneratorPro.imagePreview);

  // Generation state — backed by Redux
  const dispatch = useDispatch<AppDispatch>();
  const isLoading = useSelector((s: RootState) => s.videoGeneratorPro.isLoading);
  const progressMsg = useSelector((s: RootState) => s.videoGeneratorPro.progressMsg);
  const generatedPrompt = useSelector((s: RootState) => s.videoGeneratorPro.generatedPrompt);
  const resultUrls = useSelector((s: RootState) => s.videoGeneratorPro.resultUrls);
  const genError = useSelector((s: RootState) => s.videoGeneratorPro.genError);
  const taskId = useSelector((s: RootState) => s.videoGeneratorPro.taskId);
  const simulatedProgress = useSelector((s: RootState) => s.videoGeneratorPro.simulatedProgress);

  // Animation-only — stays local
  const [displayProgress, setDisplayProgress] = useState<number | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const simTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tickerRef = useRef<NodeJS.Timeout | null>(null);
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
    if (simTimerRef.current) {
      clearTimeout(simTimerRef.current);
      simTimerRef.current = null;
    }
    if (tickerRef.current) {
      clearInterval(tickerRef.current);
      tickerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupSSE();
    };
  }, [cleanupSSE]);

  // Restore persisted form fields on mount
  useEffect(() => {
    const saved = localStorage.getItem('novus_pro_form');
    if (saved) {
      const { productTitle: t, productDescription: d } = JSON.parse(saved);
      if (t) dispatch(setProProductTitle(t));
      if (d) dispatch(setProProductDescription(d));
    }
  }, []);

  // Persist form fields to localStorage on change
  useEffect(() => {
    localStorage.setItem('novus_pro_form', JSON.stringify({ productTitle, productDescription }));
  }, [productTitle, productDescription]);

  // Smooth display progress ticker
  useEffect(() => {
    if (simulatedProgress === null) {
      setDisplayProgress(null);
      if (tickerRef.current) { clearInterval(tickerRef.current); tickerRef.current = null; }
      return;
    }
    if (simulatedProgress === -1 || simulatedProgress === 100) {
      setDisplayProgress(simulatedProgress);
      if (tickerRef.current) { clearInterval(tickerRef.current); tickerRef.current = null; }
      return;
    }

    let intervalMs = 150;
    let maxTarget = simulatedProgress;

    if (simulatedProgress === 15) {
      // 1→15 in ~5s: 14 steps × 350ms ≈ 4.9s
      intervalMs = 350;
    } else if (simulatedProgress === 30) {
      // 15→30 in ~30s: 15 steps × 2000ms = 30s
      intervalMs = 2000;
    } else if (simulatedProgress === 60) {
      // 60→99 in ~2 min: 39 steps × 3077ms
      intervalMs = 3077;
      maxTarget = 99;
    }

    if (tickerRef.current) { clearInterval(tickerRef.current); tickerRef.current = null; }
    tickerRef.current = setInterval(() => {
      setDisplayProgress((prev) => {
        const current = prev ?? 0;
        if (current >= maxTarget) {
          clearInterval(tickerRef.current!);
          tickerRef.current = null;
          return maxTarget;
        }
        return Math.min(current + 1, maxTarget);
      });
    }, intervalMs);
    return () => {
      if (tickerRef.current) { clearInterval(tickerRef.current); tickerRef.current = null; }
    };
  }, [simulatedProgress]);

  const queryFallbackStatus = useCallback(async (fallbackTaskId: string) => {
    try {
      const data = await apiService.get<StatusResponse>(`/api/v1/generate-pro/status/${fallbackTaskId}`);
      const { state, resultUrls, failMsg } = data.data;

      if (state === 'success') {
        dispatch(setProSimulatedProgress(100));
        dispatch(setProResultUrls(resultUrls));
        dispatch(setProLoading(false));
        clearActiveJobRef.current();
        toast.success('Video berhasil dibuat!');
      } else if (state === 'fail') {
        dispatch(setProSimulatedProgress(-1));
        dispatch(setProGenError(failMsg || 'Generate video gagal'));
        dispatch(setProLoading(false));
        clearActiveJobRef.current();
        toast.error(failMsg || 'Generate video gagal');
      } else {
        // still processing — retry after 5s
        dispatch(setProProgressMsg('Menunggu hasil video (polling)...'));
        fallbackTimerRef.current = setTimeout(() => {
          queryFallbackStatus(fallbackTaskId);
        }, 5000);
      }
    } catch (err) {
      console.error('Fallback status error:', err);
      dispatch(setProGenError('Gagal mengecek status video'));
      dispatch(setProLoading(false));
    }
  }, []);

  const pollKieStatus = useCallback(async (kieTaskId: string) => {
    const apiKey = process.env.NEXT_PUBLIC_KIE_API_KEY;
    try {
      const res = await fetch(
        `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${kieTaskId}`,
        { headers: { Authorization: `Bearer ${apiKey}` } }
      );
      const json: KieJobRecord = await res.json();
      if (json.data.state === 'success') {
        const parsed = JSON.parse(json.data.resultJson!);
        dispatch(setProResultUrls(parsed.resultUrls));
        dispatch(setProSimulatedProgress(100));
        dispatch(setProLoading(false));
        clearActiveJobRef.current();
        toast.success('Video berhasil dibuat!');
      } else if (json.data.state === 'fail') {
        dispatch(setProSimulatedProgress(-1));
        dispatch(setProGenError(json.data.failMsg || 'Generate video gagal'));
        dispatch(setProLoading(false));
        clearActiveJobRef.current();
      } else {
        simTimerRef.current = setTimeout(() => pollKieStatus(kieTaskId), 30000);
      }
    } catch {
      dispatch(setProGenError('Gagal mengecek status video dari kie.ai'));
      dispatch(setProSimulatedProgress(-1));
      dispatch(setProLoading(false));
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
          dispatch(setProProgressMsg(data.message));
        }

        if (data.progress === 100) {
          dispatch(setProSimulatedProgress(100));
          dispatch(setProResultUrls(data.resultUrls));
          cleanupSSE();
          dispatch(setProLoading(false));
          clearActiveJobRef.current();
          toast.success('Video berhasil dibuat!');
        } else if (data.progress === -1) {
          dispatch(setProSimulatedProgress(-1));
          dispatch(setProGenError(data.failMsg || 'Terjadi kesalahan saat generate video'));
          cleanupSSE();
          dispatch(setProLoading(false));
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
          dispatch(setProGenError('Koneksi SSE terputus dan tidak ada fallback tersedia'));
          dispatch(setProLoading(false));
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

    dispatch(setProLoading(true));
    dispatch(setProProgressMsg('Menghubungkan ulang ke job aktif...'));
    dispatch(setProTaskId(activeJob.taskId));

    setupSSE(activeJob.jobId, authService.getAccessToken(), activeJob.taskId);
  }, [isCheckingActiveJob, activeJob, setupSSE]);

  useEffect(() => {
    if (!generatedPrompt || !taskId) return;
    dispatch(setProSimulatedProgress(15));
    simTimerRef.current = setTimeout(() => {
      dispatch(setProSimulatedProgress(30));
      simTimerRef.current = setTimeout(() => {
        dispatch(setProSimulatedProgress(60));
        pollKieStatus(taskId);
      }, 30000);
    }, 5000);
  }, [generatedPrompt, taskId, pollKieStatus]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file terlalu besar (Max 5MB)');
      return;
    }

    setImageFile(file);
    dispatch(setProImagePreview(URL.createObjectURL(file)));
  };

  const removeFile = () => {
    setImageFile(null);
    dispatch(setProImagePreview(null));
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
    dispatch(setProLoading(true));
    dispatch(setProSimulatedProgress(14));
    dispatch(setProProgressMsg(''));
    dispatch(setProGeneratedPrompt(null));
    dispatch(setProResultUrls(null));
    dispatch(setProGenError(null));

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
        dispatch(setProGeneratedPrompt(data.data.generatedPrompt));
      }

      dispatch(setProTaskId(data.data.taskId));
      setupSSE(data.data.jobId || jobId, authService.getAccessToken(), data.data.taskId);

    } catch (error: unknown) {
      toast.dismiss(loadingToast);
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem';
      toast.error(message, { position: 'top-center' });
      dispatch(setProLoading(false));
    }
  };

  const showStepper = isLoading || resultUrls !== null || genError !== null;

  const lastPositiveProgressRef = useRef(0);
  if (displayProgress !== null && displayProgress > 0) {
    lastPositiveProgressRef.current = displayProgress;
  }

  const STEPS = [
    { label: 'Upload Gambar', threshold: 5, icon: Upload },
    { label: 'Generate Prompt', threshold: 15, icon: Sparkles },
    { label: 'Submit ke Ai Generator', threshold: 30, icon: Send },
    { label: 'Rendering Video', threshold: 95, icon: Video },
    { label: 'Selesai', threshold: 100, icon: CheckCircle2 },
  ];

  const getStepStatus = (threshold: number, index: number): 'pending' | 'active' | 'completed' | 'failed' => {
    const p = displayProgress ?? 0;
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

  const stepIconStyle = (status: 'pending' | 'active' | 'completed' | 'failed') => {
    if (status === 'completed') return { backgroundColor: COLORS.medium, color: COLORS.mint };
    if (status === 'active') return { backgroundColor: COLORS.forest, color: COLORS.sage };
    if (status === 'failed') return { backgroundColor: '#3b1010', color: '#f87171' };
    return { backgroundColor: COLORS.forest, color: 'color-mix(in oklch, var(--primary) 35%, transparent)' };
  };

  const stepLabelStyle = (status: 'pending' | 'active' | 'completed' | 'failed') => {
    if (status === 'completed') return { color: COLORS.mint };
    if (status === 'active') return { color: COLORS.sage };
    if (status === 'failed') return { color: '#f87171' };
    return { color: COLORS.medium };
  };

  const connectorStyle = (status: 'pending' | 'active' | 'completed' | 'failed', nextStatus: 'pending' | 'active' | 'completed' | 'failed') => {
    if (status === 'failed' || nextStatus === 'failed') return { backgroundColor: '#7f1d1d' };
    if (nextStatus === 'completed' || nextStatus === 'active') return { backgroundColor: COLORS.sage };
    return { backgroundColor: COLORS.forest };
  };

  return (
    <div className="min-h-screen p-6 md:p-2" style={{ backgroundColor: COLORS.deepest }}>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: COLORS.mint }}>
            Pro Video Generator
          </h1>
          <p className="max-w-2xl mx-auto" style={{ color: COLORS.sage }}>
            Upload foto produk, masukkan detail produk, dan biarkan AI menghasilkan video berkualitas tinggi secara otomatis.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left: Form ─────────────────────────────────────────────── */}
          <Card className="lg:col-span-1 h-fit shadow-lg" style={{ backgroundColor: COLORS.dark, borderColor: COLORS.forest }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: COLORS.mint }}>
                <Sparkles className="w-5 h-5" style={{ color: COLORS.sage }} />
                Konfigurasi
              </CardTitle>
              <CardDescription style={{ color: COLORS.sage }}>Upload foto dan masukkan detail produk.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && activeJobReconnectedRef.current && (
                <div className="mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: COLORS.forest, borderColor: COLORS.medium, border: '1px solid', color: COLORS.mint }}>
                  <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />
                  <span>Anda memiliki generasi yang sedang berjalan. Harap tunggu hingga selesai.</span>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Image Upload */}
                <div className="space-y-1.5">
                  <Label style={{ color: COLORS.mint }}>
                    Foto Produk <span style={{ color: '#f87171' }}>*</span>
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
                      className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-all ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      style={{
                        borderColor: imagePreview ? COLORS.sage : COLORS.medium,
                        backgroundColor: imagePreview ? COLORS.forest : COLORS.deepest,
                      }}
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
                              className="absolute -top-2 -right-2 rounded-full w-5 h-5 flex items-center justify-center text-xs transition-colors"
                              style={{ backgroundColor: '#ef4444', color: COLORS.white }}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center py-6">
                          <Upload className="w-8 h-8 mb-2" style={{ color: COLORS.medium }} />
                          <p className="text-sm" style={{ color: COLORS.sage }}>Klik untuk upload foto produk</p>
                          <p className="text-xs mt-1" style={{ color: COLORS.medium }}>PNG, JPG, WEBP (Max 5MB)</p>
                        </div>
                      )}
                    </Label>
                  </div>
                  <p className="text-xs" style={{ color: COLORS.medium }}>
                    Foto ini akan dijadikan referensi visual (first frame) oleh Sora 2.
                  </p>
                </div>

                {/* Product Title */}
                <div className="space-y-1.5">
                  <Label htmlFor="productTitle" style={{ color: COLORS.mint }}>
                    Nama Produk <span style={{ color: '#f87171' }}>*</span>
                  </Label>
                  <Input
                    id="productTitle"
                    placeholder="Contoh: Sandal Wanita Hak Tahu 3cm"
                    value={productTitle}
                    onChange={(e) => dispatch(setProProductTitle(e.target.value))}
                    disabled={isLoading}
                    required
                    style={{ backgroundColor: COLORS.deepest, borderColor: COLORS.forest, color: COLORS.mint }}
                    className="placeholder:opacity-40"
                  />
                </div>

                {/* Product Description */}
                <div className="space-y-1.5">
                  <Label htmlFor="productDescription" style={{ color: COLORS.mint }}>
                    Deskripsi Produk <span style={{ color: '#f87171' }}>*</span>
                  </Label>
                  <Textarea
                    id="productDescription"
                    placeholder="Contoh: Empuk, ringan, outsole anti slip, cocok untuk harian"
                    className="resize-none placeholder:opacity-40"
                    rows={4}
                    value={productDescription}
                    onChange={(e) => dispatch(setProProductDescription(e.target.value))}
                    disabled={isLoading}
                    required
                    style={{ backgroundColor: COLORS.deepest, borderColor: COLORS.forest, color: COLORS.mint }}
                  />
                  <p className="text-xs" style={{ color: COLORS.medium }}>
                    Sebutkan fitur dan keunggulan produk secara singkat.
                  </p>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full font-semibold transition-opacity hover:opacity-90"
                  disabled={isLoading}
                  style={{ backgroundColor: COLORS.sage, color: COLORS.deepest }}
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

                <p className="text-xs text-center" style={{ color: COLORS.medium }}>
                  Rate limit: 2 request per 60 detik
                </p>
              </form>
            </CardContent>
          </Card>

          {/* ── Right: Result / Progress ────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Empty state */}
            {!isLoading && !resultUrls && !genError && !generatedPrompt && (
              <div className="min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed rounded-xl" style={{ borderColor: COLORS.forest, backgroundColor: COLORS.dark, color: COLORS.medium }}>
                <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
                <p>Hasil video akan muncul di sini</p>
              </div>
            )}

            {/* Status Stepper */}
            {showStepper && (
              <div className="rounded-xl shadow-sm p-6" style={{ backgroundColor: COLORS.dark, border: `1px solid ${COLORS.forest}` }}>
                <div className="flex items-center justify-between">
                  {STEPS.map((step, index) => {
                    const status = getStepStatus(step.threshold, index);
                    const nextStatus = index < STEPS.length - 1 ? getStepStatus(STEPS[index + 1].threshold, index + 1) : 'pending';
                    const StepIcon = status === 'failed' ? XCircle : status === 'completed' ? CheckCircle2 : step.icon;

                    return (
                      <React.Fragment key={step.label}>
                        {/* Step */}
                        <div className="flex flex-col items-center gap-1.5 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${status === 'active' ? 'animate-pulse' : ''}`}
                            style={stepIconStyle(status)}
                          >
                            <StepIcon className="w-5 h-5" />
                          </div>
                          <span
                            className="text-[10px] font-medium text-center leading-tight"
                            style={stepLabelStyle(status)}
                          >
                            {step.label}
                          </span>
                        </div>

                        {/* Connector line */}
                        {index < STEPS.length - 1 && (
                          <div
                            className="flex-1 h-0.5 mx-1 rounded transition-all"
                            style={connectorStyle(status, nextStatus)}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Progress state */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center rounded-xl shadow-sm p-8 space-y-6" style={{ backgroundColor: COLORS.dark, border: `1px solid ${COLORS.forest}` }}>
                <div className="flex flex-col items-center space-y-3">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 flex items-center justify-center" style={{ borderColor: COLORS.forest }}>
                      <Loader2 className="w-8 h-8 animate-spin" style={{ color: COLORS.sage }} />
                    </div>
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full animate-ping" style={{ backgroundColor: COLORS.sage }} />
                  </div>
                  <p className="font-medium text-center" style={{ color: COLORS.mint }}>
                    {progressMsg || 'Menghubungkan ke Ai Generator...'}
                  </p>
                </div>

                <div className="w-full max-w-md space-y-2">
                  <Progress value={displayProgress ?? 0} className="h-2" />
                  <div className="flex items-center justify-between text-xs" style={{ color: COLORS.medium }}>
                    <div className="flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" style={{ color: COLORS.sage }} />
                      <span>Processing...</span>
                    </div>
                    <span style={{ color: COLORS.sage }}>{displayProgress ?? 0}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: COLORS.forest, border: `1px solid ${COLORS.medium}`, color: COLORS.mint }}>
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: COLORS.sage }} />
                  <span>Jangan meninggalkan halaman ini! Video sedang diproses.</span>
                </div>
              </div>
            )}

            {/* Generated Prompt Preview */}
            {generatedPrompt && (
              <Card style={{ backgroundColor: COLORS.dark, borderColor: COLORS.forest }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.sage }}>
                    <Sparkles className="w-4 h-4" />
                    Generated Prompt (GPT-4o Vision)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed" style={{ color: COLORS.mint }}>
                    {generatedPrompt}
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Error state */}
            {!isLoading && genError && (
              <div className="min-h-[200px] flex flex-col items-center justify-center rounded-xl p-8 space-y-3 animate-in fade-in duration-500" style={{ backgroundColor: '#1a0808', border: '1px solid #7f1d1d' }}>
                <p className="font-semibold" style={{ color: '#fca5a5' }}>Generate Video Gagal</p>
                <p className="text-sm text-center" style={{ color: '#f87171' }}>{genError}</p>
                <Button
                  size="sm"
                  onClick={() => { dispatch(resetPro()); cleanupSSE(); localStorage.removeItem('novus_pro_form'); }}
                  style={{ backgroundColor: COLORS.sage, color: COLORS.deepest }}
                >
                  Buat Lagi
                </Button>
              </div>
            )}

            {/* Result */}
            {!isLoading && resultUrls && (
              <>
                <VideoResultCard urls={resultUrls} />
                <div className="flex justify-end">
                  <Button
                    onClick={() => { dispatch(resetPro()); cleanupSSE(); localStorage.removeItem('novus_pro_form'); }}
                    style={{ backgroundColor: COLORS.sage, color: COLORS.deepest }}
                  >
                    Buat Lagi
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
