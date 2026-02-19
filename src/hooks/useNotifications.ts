'use client';

import useSWR from 'swr';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import apiService from '@/lib/fetch';
import toast from 'react-hot-toast';

// --- Types ---
export interface Notification {
  id: string;
  userId: number;
  type: string;
  title: string;
  message: string;
  jobId: string | null;
  isRead: boolean;
  createdAt: string;
}

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

interface NotificationListData {
  notifications: Notification[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

interface UnreadCountData {
  count: number;
}

const SESSION_KEY = 'novus_notif_toasted';

const fetcher = async <T>(url: string): Promise<ApiResponse<T>> => {
  return apiService.get<ApiResponse<T>>(url);
};

export function useNotifications() {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  const listKey = accessToken ? '/api/v1/notifications?page=1&limit=20' : null;
  const countKey = accessToken ? '/api/v1/notifications/unread-count' : null;

  const {
    data: listData,
    isLoading,
    mutate: mutateList,
  } = useSWR<ApiResponse<NotificationListData>>(listKey, fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 30_000,
    shouldRetryOnError: false,
  });

  const {
    data: countData,
    mutate: mutateCount,
  } = useSWR<ApiResponse<UnreadCountData>>(countKey, fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 30_000,
    shouldRetryOnError: false,
  });

  // Toast on login — fires once per session
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    if (!listData?.data?.notifications) return;

    const unread = listData.data.notifications.filter((n) => !n.isRead);
    if (unread.length === 0) return;

    sessionStorage.setItem(SESSION_KEY, '1');

    unread.slice(0, 3).forEach((n) => {
      if (n.type.includes('success')) {
        toast.success(n.message, { duration: 5000 });
      } else if (n.type.includes('fail') || n.type.includes('error')) {
        toast.error(n.message, { duration: 5000 });
      } else {
        toast(n.message, { duration: 5000 });
      }
    });

    if (unread.length > 3) {
      toast(`+${unread.length - 3} notifikasi lainnya`, { duration: 4000 });
    }
  }, [listData]);

  const markAsRead = async (id: string) => {
    mutateList(
      (prev) => {
        if (!prev?.data?.notifications) return prev;
        return {
          ...prev,
          data: {
            ...prev.data,
            notifications: prev.data.notifications.map((n) =>
              n.id === id ? { ...n, isRead: true } : n
            ),
          },
        };
      },
      false
    );
    mutateCount(
      (prev) => {
        if (!prev?.data) return prev;
        return { ...prev, data: { count: Math.max(0, prev.data.count - 1) } };
      },
      false
    );

    try {
      await apiService.patch(`/api/v1/notifications/${id}/read`);
    } catch {
      mutateList();
      mutateCount();
    }
  };

  const markAllAsRead = async () => {
    mutateList(
      (prev) => {
        if (!prev?.data?.notifications) return prev;
        return {
          ...prev,
          data: {
            ...prev.data,
            notifications: prev.data.notifications.map((n) => ({ ...n, isRead: true })),
          },
        };
      },
      false
    );
    mutateCount(
      (prev) => {
        if (!prev?.data) return prev;
        return { ...prev, data: { count: 0 } };
      },
      false
    );

    try {
      await apiService.patch('/api/v1/notifications/read-all');
    } catch {
      mutateList();
      mutateCount();
    }
  };

  return {
    notifications: listData?.data?.notifications ?? [],
    unreadCount: countData?.data?.count ?? 0,
    isLoading,
    markAsRead,
    markAllAsRead,
    mutate: mutateList,
  };
}
