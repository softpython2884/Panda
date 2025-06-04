
"use client"; 
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import type { ReactNode } from 'react';
import { useEffect, useState } from "react";
import { Loader2, Menu } from "lucide-react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isCheckingAuthSession } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isCheckingAuthSession && !user) {
      router.push('/auth/login?redirect=/dashboard');
    }
  }, [user, isCheckingAuthSession, router]);

  if (isCheckingAuthSession || (!user && isCheckingAuthSession && typeof window !== 'undefined')) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading dashboard...</p>
      </div>
    );
  }
  
  if (!user) {
     return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-var(--navbar-height,80px))]">
      <DashboardSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <header className="p-4 border-b bg-card sticky top-[var(--navbar-height,80px)] z-40 md:hidden">
        {/* Header for mobile to toggle sidebar, shown above content */}
        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Open Menu</span>
        </Button>
      </header>
      <div className="flex flex-1">
        {/* Hidden on mobile, shown on desktop */}
        <aside className="hidden md:flex md:w-72 lg:w-80 xl:w-96 p-4 flex-shrink-0">
            <div className="sticky top-24 space-y-4 w-full">
                 <Button variant="outline" onClick={() => setIsSidebarOpen(true)} className="w-full justify-start text-lg py-3">
                    <Menu className="mr-2 h-5 w-5" /> Menu PANDA
                </Button>
            </div>
        </aside>
        <main className="flex-grow p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
