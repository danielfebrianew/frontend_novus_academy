import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar"; // Pastikan path import benar

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      {/* 1. Sidebar Kiri */}
      <AppSidebar />
      
      {/* 2. Area Konten Utama */}
      <main className="w-full min-h-screen bg-slate-50 transition-all duration-300 ease-in-out">
        {/* Header kecil untuk trigger sidebar (Hamburger menu) */}
        <div className="p-4 flex items-center gap-2 border-b bg-white sticky top-0 z-10">
            <SidebarTrigger />
            <span className="text-sm font-semibold text-slate-700">Novus Studio</span>
        </div>

        {/* Konten Halaman (Page) akan dirender di sini */}
        <div className="p-4 md:p-6">
            {children}
        </div>
      </main>
    </SidebarProvider>
  );
}