'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { useActiveJob } from '@/hooks/useActiveJob';
import { authService } from '@/lib/authService';
import apiService from '@/lib/fetch';
import toast from 'react-hot-toast';
import {
  setProLoading, setProTaskId, setProProgressMsg, setProSimulatedProgress,
  setProGeneratedPrompt, setProResultUrls, setProGenError, resetPro,
} from '@/store/videoGeneratorProSlice';
import {
  CreateProResponse, ProProgressEvent, StatusResponse, KieJobRecord, VideoFormData,
} from '../_types';
import { API_URL, FACE_CHARACTER_VALUE_MAP } from '../_utils/constants';

export function useVideoGeneration() {
  const { activeJob, isCheckingActiveJob, clearActiveJob } = useActiveJob();
  const dispatch = useDispatch<AppDispatch>();

  const simulatedProgress = useSelector((s: RootState) => s.videoGeneratorPro.simulatedProgress);
  const generatedPrompt = useSelector((s: RootState) => s.videoGeneratorPro.generatedPrompt);
  const taskId = useSelector((s: RootState) => s.videoGeneratorPro.taskId);

  const [displayProgress, setDisplayProgress] = useState<number | null>(null);
  const lastPositiveProgressRef = useRef(0);

  const eventSourceRef = useRef<EventSource | null>(null);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const simTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tickerRef = useRef<NodeJS.Timeout | null>(null);
  const clearActiveJobRef = useRef(clearActiveJob);
  clearActiveJobRef.current = clearActiveJob;
  const activeJobReconnectedRef = useRef(false);

  // Track last positive progress during render (for failed state display)
  if (displayProgress !== null && displayProgress > 0) {
    lastPositiveProgressRef.current = displayProgress;
  }

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
    return () => cleanupSSE();
  }, [cleanupSSE]);

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
      // 1 → 15 in ~10s
      intervalMs = 700; // 14 × 700ms ≈ 9.8s
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
        dispatch(setProProgressMsg('Menunggu hasil video (polling)...'));
        fallbackTimerRef.current = setTimeout(() => queryFallbackStatus(fallbackTaskId), 5000);
      }
    } catch (err) {
      console.error('Fallback status error:', err);
      dispatch(setProGenError('Gagal mengecek status video'));
      dispatch(setProLoading(false));
    }
  }, [dispatch]);

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
  }, [dispatch]);

  const setupSSE = useCallback((jobId: string, token: string | null, fallbackTaskId: string | null) => {
    const progressUrl = `${API_URL}/api/v1/generate-pro/progress/${jobId}${token ? `?token=${token}` : ''}`;
    const eventSource = new EventSource(progressUrl);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        const data: ProProgressEvent = parsed.data || parsed;

        if (data.message) dispatch(setProProgressMsg(data.message));

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
  }, [cleanupSSE, queryFallbackStatus, dispatch]);

  // Reconnect to active job on mount
  useEffect(() => {
    if (isCheckingActiveJob) return;

    if (!activeJob) {
      dispatch(setProLoading(false));
      return;
    }
    
    if (activeJobReconnectedRef.current) return;

    activeJobReconnectedRef.current = true;
    dispatch(setProLoading(true));
    dispatch(setProProgressMsg('Menghubungkan ulang ke job aktif...'));
    dispatch(setProTaskId(activeJob.taskId));
    setupSSE(activeJob.jobId, authService.getAccessToken(), activeJob.taskId);
  }, [isCheckingActiveJob, activeJob, setupSSE, dispatch]);

  // Start simulated progress + Kie polling when generatedPrompt arrives
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
  }, [generatedPrompt, taskId, pollKieStatus, dispatch]);

  const submitVideoJob = useCallback(async ({
    imageFile, productTitle, productDescription, faceCharacter, customFaceCharacter,
  }: VideoFormData) => {
    cleanupSSE();
    lastPositiveProgressRef.current = 0;
    dispatch(setProLoading(true));
    dispatch(setProSimulatedProgress(1));
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

      if (faceCharacter && faceCharacter !== 'custom') {
        const mappedValue = FACE_CHARACTER_VALUE_MAP[faceCharacter] ?? faceCharacter;
        formData.append('faceCharacter', mappedValue);
      }
      if (faceCharacter === 'custom' && customFaceCharacter.trim()) {
        formData.append('customFaceCharacter', customFaceCharacter.trim());
      }

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
  }, [cleanupSSE, dispatch, setupSSE]);

  const cleanupAndReset = useCallback(() => {
    cleanupSSE();
    dispatch(resetPro());
    localStorage.removeItem('novus_pro_form');
  }, [cleanupSSE, dispatch]);

  return {
    displayProgress,
    lastPositiveProgressRef,
    submitVideoJob,
    cleanupSSE,
    cleanupAndReset,
    activeJob,
    isCheckingActiveJob,
  };
}
