import useSWR from 'swr';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import apiService from '@/lib/fetch';

export interface ActiveJobData {
  jobId: string;
  taskId: string;
  status: 'processing';
}

export function useActiveJob() {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  const { data, isLoading, mutate } = useSWR<ActiveJobData | null>(
    accessToken ? '/api/v1/generate-pro/active-job' : null,
    async (url: string) => {
      const res = await apiService.get<{ data: ActiveJobData | null }>(url);
      return res.data ?? null; // langsung unwrap .data di fetcher
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      revalidateOnMount: true,
      revalidateIfStale: false,
    }
  );

  return {
    activeJob: data ?? null,          // sudah ActiveJobData | null, tidak perlu .data lagi
    isCheckingActiveJob: isLoading,
    clearActiveJob: () => mutate(null, false),
  };
}
