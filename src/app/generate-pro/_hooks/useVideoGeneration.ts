'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store/store';
import { useActiveJob } from '@/app/generate-pro/_hooks/useActiveJob';
import apiService from '@/lib/fetch';
import { authService } from '@/lib/authService';
import toast from 'react-hot-toast';
import {
  setProLoading, setProTaskId, setProProgressMsg, setProSimulatedProgress,
  setProGeneratedPrompt, setProResultUrls, setProGenError, resetPro,
} from '@/store/videoGeneratorProSlice';
import { CreateProResponse, StatusResponse, VideoFormData } from '../_types';
import { FACE_CHARACTER_VALUE_MAP } from '../_utils/constants';

// ─── Constants ──────────────────────────────────────────────────────────────
const POLL_INTERVAL_MS = 8_000;
const MAX_POLL_ATTEMPTS = 30;
const PROGRESS_STORAGE_KEY = 'novus_pro_progress';

/**
 * Simulated progress curve:
 *
 *   1-10%  → 1% per detik (10s total, fase upload)
 *   10-15% → 1% per 1.5 detik (7.5s total)
 *   15-90% → 1% per 1 detik (75s total)
 *   90-99% → 1% per 2 detik (18s total)
 *   99%    → stuck, nunggu polling confirm
 *   done   → loncat ke 100% (snap saat polling success)
 */
const PROGRESS_STAGES: { targetProgress: number; intervalMs: number }[] = [
  { targetProgress: 10, intervalMs: 1_000 },   // 1% per detik
  { targetProgress: 90, intervalMs: 1_000 },   // 1% per 1 detik
  { targetProgress: 99, intervalMs: 2_000 },   // 1% per 2 detik
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
type TimerRef = React.RefObject<NodeJS.Timeout | null>;
const clearTimer = (r: TimerRef) => { if (r.current) { clearTimeout(r.current); r.current = null; } };
const clearTicker = (r: TimerRef) => { if (r.current) { clearInterval(r.current); r.current = null; } };

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useVideoGeneration() {
  const { activeJob, isCheckingActiveJob, clearActiveJob } = useActiveJob();
  const dispatch = useDispatch<AppDispatch>();

  const [displayProgress, setDisplayProgress] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = sessionStorage.getItem(PROGRESS_STORAGE_KEY);
    return saved ? Number(saved) : null;
  });
  const lastPositiveProgressRef = useRef(0);

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stageTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tickerRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef(0);
  const isPollingRef = useRef(false);

  const clearActiveJobRef = useRef(clearActiveJob);
  clearActiveJobRef.current = clearActiveJob;
  const activeJobReconnectedRef = useRef(false);

  if (displayProgress !== null && displayProgress > 0) {
    lastPositiveProgressRef.current = displayProgress;
  }

  // ── Persist progress to sessionStorage ──────────────────────────────────
  useEffect(() => {
    if (displayProgress !== null && displayProgress > 0 && displayProgress < 100) {
      sessionStorage.setItem(PROGRESS_STORAGE_KEY, String(displayProgress));
    }
  }, [displayProgress]);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    clearTimer(pollTimerRef);
    clearTimer(stageTimerRef);
    clearTicker(tickerRef);
    isPollingRef.current = false;
    pollCountRef.current = 0;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  // ── Snap helpers ───────────────────────────────────────────────────────────
  const snapToComplete = useCallback(() => { clearTicker(tickerRef); setDisplayProgress(100); sessionStorage.removeItem(PROGRESS_STORAGE_KEY); }, []);
  const snapToFailed = useCallback(() => { clearTicker(tickerRef); setDisplayProgress(-1); sessionStorage.removeItem(PROGRESS_STORAGE_KEY); }, []);

  // ── Simulated progress (supports resuming from a saved value) ─────────────
  const startSimulatedProgress = useCallback((fromProgress = 1) => {
    setDisplayProgress(fromProgress);
    clearTicker(tickerRef);
    clearTimer(stageTimerRef);

    // Find the correct stage to resume from
    let stageIndex = 0;
    while (stageIndex < PROGRESS_STAGES.length && fromProgress >= PROGRESS_STAGES[stageIndex].targetProgress) {
      stageIndex++;
    }

    let currentProgress = fromProgress;

    const runNextStage = () => {
      if (stageIndex >= PROGRESS_STAGES.length) return;

      const { targetProgress, intervalMs } = PROGRESS_STAGES[stageIndex];
      if (currentProgress >= targetProgress) { stageIndex++; runNextStage(); return; }

      clearTicker(tickerRef);
      tickerRef.current = setInterval(() => {
        currentProgress += 1;
        setDisplayProgress(currentProgress);

        if (currentProgress >= targetProgress) {
          clearTicker(tickerRef);
          stageIndex++;
          stageTimerRef.current = setTimeout(runNextStage, 300);
        }
      }, intervalMs);
    };

    runNextStage();
  }, []);

  // ── HTTP Polling ───────────────────────────────────────────────────────────
  const pollStatus = useCallback(async (activeTaskId: string) => {
    if (!isPollingRef.current) return;

    pollCountRef.current += 1;

    if (pollCountRef.current > MAX_POLL_ATTEMPTS) {
      cleanup();
      snapToFailed();
      dispatch(setProGenError('Silakan coba lagi.'));
      dispatch(setProLoading(false));
      return;
    }

    try {
      const data = await apiService.get<StatusResponse>(
        `/api/v1/generate-pro/status/${activeTaskId}`,
      );
      const { state, resultUrls, failMsg } = data.data;

      if (state === 'success') {
        cleanup();
        snapToComplete();
        dispatch(setProSimulatedProgress(100));
        dispatch(setProResultUrls(resultUrls));
        dispatch(setProLoading(false));
        clearActiveJobRef.current();
        toast.success('Video berhasil dibuat!');
        return;
      }

      if (state === 'fail') {
        cleanup();
        snapToFailed();
        dispatch(setProSimulatedProgress(-1));
        dispatch(setProGenError(failMsg || 'Generate video gagal'));
        dispatch(setProLoading(false));
        clearActiveJobRef.current();
        toast.error(failMsg || 'Generate video gagal');
        return;
      }

      // Masih proses — jadwalkan poll berikutnya
      dispatch(setProProgressMsg('Video sedang diproses...'));
      pollTimerRef.current = setTimeout(() => pollStatus(activeTaskId), POLL_INTERVAL_MS);
    } catch (err) {
      console.error('Poll error:', err);
      // Retry on network hiccup, jangan langsung fail
      pollTimerRef.current = setTimeout(() => pollStatus(activeTaskId), POLL_INTERVAL_MS);
    }
  }, [cleanup, snapToComplete, snapToFailed, dispatch]);

  // ── Start polling (progress sudah jalan dari submit) ─────────────────────
  const startJob = useCallback((activeTaskId: string) => {
    pollCountRef.current = 0;
    isPollingRef.current = true;
    pollTimerRef.current = setTimeout(() => pollStatus(activeTaskId), POLL_INTERVAL_MS);
  }, [pollStatus]);

  // ── Reconnect active job on mount ──────────────────────────────────────────
  useEffect(() => {
    if (isCheckingActiveJob) return;
    if (!activeJob) { dispatch(setProLoading(false)); return; }
    if (activeJobReconnectedRef.current) return;

    activeJobReconnectedRef.current = true;
    dispatch(setProLoading(true));
    dispatch(setProProgressMsg('Menghubungkan ulang ke job aktif...'));
    dispatch(setProTaskId(activeJob.taskId));

    const saved = sessionStorage.getItem(PROGRESS_STORAGE_KEY);
    const resumeFrom = saved ? Math.min(Number(saved), 99) : 1;
    startSimulatedProgress(resumeFrom);
    startJob(activeJob.taskId);
  }, [isCheckingActiveJob, activeJob, startSimulatedProgress, startJob, dispatch]);

  // ── Submit job ─────────────────────────────────────────────────────────────
  const submitVideoJob = useCallback(async ({
    imageFile, productTitle, productDescription, faceCharacter, customFaceCharacter,
  }: VideoFormData) => {
    cleanup();
    lastPositiveProgressRef.current = 0;

    dispatch(setProLoading(true));
    dispatch(setProProgressMsg('Mengupload file...'));
    dispatch(setProGeneratedPrompt(null));
    dispatch(setProResultUrls(null));
    dispatch(setProGenError(null));

    // Mulai simulated progress langsung (1→10→15%)
    setDisplayProgress(1);
    startSimulatedProgress();

    const jobId = crypto.randomUUID();
    const loadingToast = toast.loading('Mengupload file...', { position: 'top-center' });

    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('jobId', jobId);
      formData.append('productTitle', productTitle.trim());
      formData.append('productDescription', productDescription.trim());

      if (faceCharacter && faceCharacter !== 'custom') {
        formData.append('faceCharacter', FACE_CHARACTER_VALUE_MAP[faceCharacter] ?? faceCharacter);
      }
      if (faceCharacter === 'custom' && customFaceCharacter.trim()) {
        formData.append('customFaceCharacter', customFaceCharacter.trim());
      }

      // Upload via XHR
      const data = await new Promise<CreateProResponse>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        xhr.open('POST', `${apiBaseUrl}/api/v1/generate-pro/create`);

        const token = authService.getAccessToken();
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.withCredentials = true;

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try { resolve(JSON.parse(xhr.responseText)); }
            catch { reject(new Error('Invalid response from server')); }
          } else {
            let msg = `HTTP error! status: ${xhr.status}`;
            try {
              const body = JSON.parse(xhr.responseText);
              // Backend now returns InternalServerErrorException with proper message
              msg = body.message || msg;
            } catch { /* ignore parse errors */ }
            reject(new Error(msg));
          }
        };

        xhr.onerror = () => reject(new Error('Tidak dapat terhubung ke server'));
        xhr.send(formData);
      });

      toast.dismiss(loadingToast);
      toast.success('Task dikirim! Menunggu hasil video...', { position: 'top-center' });
      dispatch(setProProgressMsg('Video sedang diproses...'));

      if (data.data.generatedPrompt) dispatch(setProGeneratedPrompt(data.data.generatedPrompt));

      const resolvedTaskId = data.data.taskId;
      dispatch(setProTaskId(resolvedTaskId));
      startJob(resolvedTaskId);
    } catch (error: unknown) {
      toast.dismiss(loadingToast);
      cleanup();
      snapToFailed();
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem';
      dispatch(setProGenError(message));
      dispatch(setProLoading(false));
      toast.error(message, { position: 'top-center' });
    }
  }, [cleanup, snapToFailed, startSimulatedProgress, startJob, dispatch]);

  // ── Reset ──────────────────────────────────────────────────────────────────
  const cleanupAndReset = useCallback(() => {
    cleanup();
    setDisplayProgress(null);
    sessionStorage.removeItem(PROGRESS_STORAGE_KEY);
    dispatch(resetPro());
    localStorage.removeItem('novus_pro_form');
  }, [cleanup, dispatch]);

  return {
    displayProgress,
    lastPositiveProgressRef,
    submitVideoJob,
    cleanupAndReset,
    activeJob,
    isCheckingActiveJob,
  };
}