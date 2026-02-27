// src/app/gallery/_hooks/useGallery.ts

import { useEffect, useRef, useCallback } from "react";
import useSWR, { mutate } from "swr";
import { useSelector } from "react-redux";
import { ApiResponse, GalleryResponse, VideoJobDetail } from "../_types/index";
import apiService from "@/lib/fetch";

interface RootState {
  auth: {
    accessToken: string | null;
  };
}

// Use apiService which auto-injects JWT token + handles 401 refresh
const fetcher = async <T>(url: string): Promise<ApiResponse<T>> => {
  return apiService.get<ApiResponse<T>>(url);
};

// ---------------------------------------------------------------------------
// Hook: ambil list jobs (grid view)
// ---------------------------------------------------------------------------
export function useGallery(page: number = 1, limit: number = 30) {
  const token = useSelector((state: RootState) => state.auth.accessToken);

  const url = token ? `/api/v1/gallery/jobs?page=${page}&limit=${limit}` : null;

  const { data, error, isLoading, mutate: mutateGallery } = useSWR<ApiResponse<GalleryResponse>>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      // Poll every 15s when any job is still processing
      refreshInterval: (latestData) =>
        (latestData as ApiResponse<GalleryResponse> | undefined)?.data?.jobs?.some((j) => j.status === "processing") ? 15000 : 0,
    }
  );

  return {
    gallery: data?.data,
    isLoading,
    isError: !!error,
    mutate: mutateGallery,
  };
}

// ---------------------------------------------------------------------------
// Hook: ambil detail satu job (modal)
// ---------------------------------------------------------------------------
export function useJobDetail(jobId: string | null) {
  const token = useSelector((state: RootState) => state.auth.accessToken);

  const url = jobId && token ? `/api/v1/gallery/jobs/${jobId}` : null;

  const { data, error, isLoading, mutate: mutateDetail } = useSWR<ApiResponse<VideoJobDetail>>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  // Poll Kie AI directly when job is processing
  useKieStatusSync(
    data?.data?.status === "processing" ? data.data.jobId : null,
    () => {
      mutateDetail();
      // Also revalidate gallery list so card updates
      mutate(
        (key) => typeof key === "string" && key.startsWith("/api/v1/gallery/jobs"),
        undefined,
        { revalidate: true }
      );
    }
  );

  return {
    jobDetail: data?.data,
    isLoading,
    isError: !!error,
    mutate: mutateDetail,
  };
}

// ---------------------------------------------------------------------------
// Hook: poll Kie AI status directly for processing jobs
// ---------------------------------------------------------------------------
const KIE_API_KEY = process.env.NEXT_PUBLIC_KIE_API_KEY;

function useKieStatusSync(
  kieTaskId: string | null,
  onStatusChanged: () => void,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onStatusChangedRef = useRef(onStatusChanged);
  onStatusChangedRef.current = onStatusChanged;

  const poll = useCallback(async (taskId: string) => {
    try {
      const res = await fetch(
        `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`,
        { headers: { Authorization: `Bearer ${KIE_API_KEY}` } }
      );
      const json = await res.json();
      const state = json?.data?.state;

      if (state === "success" || state === "fail") {
        // Trigger backend to sync Kie status into DB first
        try {
          await apiService.get(`/api/v1/generate-pro/status/${taskId}`);
        } catch { /* ignore — backend sync is best-effort */ }
        // Then revalidate gallery data
        onStatusChangedRef.current();
      } else {
        // Still processing — poll again in 10s
        timerRef.current = setTimeout(() => poll(taskId), 10000);
      }
    } catch {
      // On error, retry in 15s
      timerRef.current = setTimeout(() => poll(taskId), 15000);
    }
  }, []);

  useEffect(() => {
    if (!kieTaskId) return;

    // Start polling after 5s delay
    timerRef.current = setTimeout(() => poll(kieTaskId), 5000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [kieTaskId, poll]);
}

// ---------------------------------------------------------------------------
// Action: delete job
// ---------------------------------------------------------------------------
export async function deleteJob(jobId: string) {
  await apiService.delete(`/api/v1/gallery/jobs/${jobId}`);

  mutate(
    (key) => typeof key === "string" && key.startsWith("/api/v1/gallery/jobs"),
    undefined,
    { revalidate: true }
  );
}
