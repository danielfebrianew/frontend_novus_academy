import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider suppressHydrationWarning>
      <AppSidebar />

      <main className="flex-1 min-h-screen bg-slate-50 transition-all duration-300 ease-in-out">
        <AppHeader />

        <div className="p-4 md:p-6">
            {children}
        </div>
      </main>
    </SidebarProvider>
  );
}
