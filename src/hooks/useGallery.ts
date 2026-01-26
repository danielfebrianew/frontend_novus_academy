import useSWR, { mutate } from 'swr';
import { apiService } from "@/lib/fetch"; 
import { GalleryResponse, VideoJobDetail } from '@/types/gallery';

// Helper interface for your Standard API Response wrapper
interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

const fetcher = <T>(url: string) => apiService.get<T>(url);

export function useGallery(page: number = 1, limit: number = 30) {
  const url = `/api/v1/gallery/jobs?page=${page}&limit=${limit}`;

  const { data, error, isLoading, mutate: mutateGallery } = useSWR<ApiResponse<GalleryResponse>>(
    url,
    fetcher
  );

  return {
    gallery: data?.data, 
    isLoading,
    isError: error,
    mutate: mutateGallery, 
  };
}

export function useJobDetail(jobId: string | null) {
  const url = jobId ? `/api/v1/gallery/jobs/${jobId}` : null;

  // Same fix for Detail view
  const { data, error, isLoading, mutate: mutateDetail } = useSWR<ApiResponse<VideoJobDetail>>(
    url,
    fetcher
  );

  return {
    // ✅ FIX: Unwrap here too
    jobDetail: data?.data,
    isLoading,
    isError: error,
    mutate: mutateDetail,
  };
}

// ... deleteJob functions remain the same ...
export const deleteJob = async (jobId: string) => {
  try {
    await apiService.delete(`/api/v1/gallery/jobs/${jobId}`);
    mutate(
      (key) => typeof key === 'string' && key.startsWith('/api/v1/gallery/jobs'),
      undefined, 
      { revalidate: true }
    );
    return true;
  } catch (error) {
    console.error("Failed to delete job:", error);
    throw error;
  }
};