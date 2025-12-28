// src/app/(auth)/layout.tsx
import { Navbar } from "@/components/layout/AppNavbar";
import { Toaster } from "react-hot-toast";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {children}
        <Toaster position="top-center" />
      </main>
    </div>
  );
}