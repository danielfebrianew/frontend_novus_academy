// src/app/gallery/_hooks/useGallery.ts

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
    { revalidateOnFocus: false, shouldRetryOnError: false }
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
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  return {
    jobDetail: data?.data,
    isLoading,
    isError: !!error,
    mutate: mutateDetail,
  };
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
