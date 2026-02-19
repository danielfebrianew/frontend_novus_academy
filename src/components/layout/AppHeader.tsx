'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { NotificationBell } from './NotificationBell';
import { Toaster } from 'react-hot-toast';

export function AppHeader() {
  return (
    <div className="p-4 flex items-center gap-2 border-b bg-white sticky top-0 z-10">
      <SidebarTrigger />
      <span className="text-sm font-semibold text-slate-700">Novus Studio</span>
      <div className="ml-auto">
        <NotificationBell />
      </div>
      <Toaster position="top-center" />
    </div>
  );
}
