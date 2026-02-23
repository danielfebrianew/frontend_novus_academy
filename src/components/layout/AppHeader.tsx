'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Toaster } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { logout } from '@/store/authSlice';
import { authService } from '@/lib/authService';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User } from 'lucide-react';

export function AppHeader() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const userData = {
    name: user?.username || user?.name || 'Guest',
    email: user?.email || '',
    avatar: user?.avatar || '',
    initials: user?.username ? user.username.substring(0, 2).toUpperCase() : 'CN',
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error(error);
    } finally {
      localStorage.removeItem('currentUser');
      dispatch(logout());
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <div className="p-4 flex items-center gap-2 border-b bg-white sticky top-0 z-10">
      <SidebarTrigger />
      <span className="text-sm font-semibold text-slate-700">Novus Studio</span>
      <div className="ml-auto flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center rounded-lg px-2 py-1 hover:bg-slate-100 transition-colors">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={userData.avatar} alt={userData.name} />
                <AvatarFallback className="rounded-lg text-xs">{userData.initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-48 rounded-lg" side="bottom" align="end" sideOffset={6}>
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push('/dashboard/settings/profile')} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Toaster position="top-center" />
    </div>
  );
}
