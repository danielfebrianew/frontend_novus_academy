import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";

export default function GenerateProLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider suppressHydrationWarning>
      <AppSidebar />

      <main className="w-full min-h-screen bg-slate-50 transition-all duration-300 ease-in-out">
        <div className="p-4 flex items-center gap-2 border-b bg-white sticky top-0 z-10">
          <SidebarTrigger />
          <span className="text-sm font-semibold text-slate-700">Novus Studio</span>
        </div>

        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}
