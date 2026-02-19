import useSWR from 'swr';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import apiService from '@/lib/fetch';

export interface ActiveJobData {
  jobId: string;
  taskId: string;
  status: 'processing';
}

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

const fetcher = async <T>(url: string): Promise<ApiResponse<T>> => {
  return apiService.get<ApiResponse<T>>(url);
};

export function useActiveJob() {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  const { data, isLoading, mutate } = useSWR<ApiResponse<ActiveJobData | null>>(
    accessToken ? '/api/v1/generate-pro/active-job' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      revalidateOnMount: true,
      revalidateIfStale: false,
    }
  );

  return {
    activeJob: data?.data ?? null,
    isCheckingActiveJob: isLoading,
    clearActiveJob: () =>
      mutate({ statusCode: 200, message: 'ok', data: null }, false),
  };
}
