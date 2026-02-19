'use client';

import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, Notification } from '@/hooks/useNotifications';

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} menit lalu`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} hari lalu`;

  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  });
}

function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: () => void;
}) {
  const isUnread = !notification.isRead;

  return (
    <button
      onClick={onRead}
      className={`w-full text-left px-4 py-3 border-b last:border-0 hover:bg-slate-50 transition-colors flex gap-3 ${
        isUnread ? 'bg-purple-50/50' : ''
      }`}
    >
      <span
        className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${
          notification.type.includes('success')
            ? 'bg-green-500'
            : notification.type.includes('fail') || notification.type.includes('error')
              ? 'bg-red-500'
              : 'bg-blue-500'
        }`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-500 mb-0.5">
          {notification.title}
        </p>
        <p
          className={`text-sm leading-snug ${
            isUnread ? 'font-medium text-slate-800' : 'text-slate-600'
          }`}
        >
          {notification.message}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>
    </button>
  );
}

export function NotificationBell() {
  const { unreadCount, notifications, isLoading, markAsRead, markAllAsRead } =
    useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-slate-600" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 min-w-4 p-0 flex items-center justify-center text-[10px]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="text-sm font-semibold text-slate-700">
            Notifikasi
          </span>
          {unreadCount > 0 && (
            <button
              className="text-xs text-purple-600 hover:text-purple-700 font-medium"
              onClick={markAllAsRead}
            >
              Tandai semua dibaca
            </button>
          )}
        </div>

        <ScrollArea className="max-h-80">
          {isLoading && (
            <div className="flex items-center justify-center h-20 text-sm text-slate-400">
              Memuat...
            </div>
          )}

          {!isLoading && notifications.length === 0 && (
            <div className="flex items-center justify-center h-20 text-sm text-slate-400">
              Belum ada notifikasi
            </div>
          )}

          {notifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onRead={() => {
                if (!n.isRead) markAsRead(n.id);
              }}
            />
          ))}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
