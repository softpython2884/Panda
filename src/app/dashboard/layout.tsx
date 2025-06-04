
"use client"; 
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import type { ReactNode } from 'react';
import { useEffect, useState } from "react";
import { Loader2, Menu } from "lucide-react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isCheckingAuthSession } = useAuth();
  const router = useRouter();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  const isDesktop = useMediaQuery("(min-width: 768px)"); // md breakpoint

  useEffect(() => {
    if (!isCheckingAuthSession && !user) {
      router.push('/auth/login?redirect=/dashboard');
    }
  }, [user, isCheckingAuthSession, router]);

  if (isCheckingAuthSession || (!user && isCheckingAuthSession && typeof window !== 'undefined')) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-var(--navbar-height,80px))]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Chargement du tableau de bord...</p>
      </div>
    );
  }
  
  if (!user) {
     return (
      <div className="flex items-center justify-center min-h-[calc(100vh-var(--navbar-height,80px))]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Redirection vers la connexion...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-var(--navbar-height,80px))] md:flex-row">
      {!isDesktop && (
        <header className="p-4 border-b bg-card sticky top-[var(--navbar-height,80px)] z-40 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setIsMobileSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
            <span className="sr-only">Ouvrir Menu</span>
          </Button>
        </header>
      )}
      
      <Sheet open={isMobileSidebarOpen && !isDesktop} onOpenChange={setIsMobileSidebarOpen}>
        <SheetContent side="left" className="w-[280px] sm:w-[320px] bg-card p-0 md:hidden z-50">
          <DashboardSidebar 
              isMobileView={true} 
              setIsOpen={setIsMobileSidebarOpen} 
          />
        </SheetContent>
      </Sheet>

      {isDesktop && (
        <aside className="w-72 lg:w-80 xl:w-96 border-r flex-shrink-0 hidden md:block">
          <div className="sticky top-[var(--navbar-height,80px)] h-[calc(100vh-var(--navbar-height,80px))] overflow-y-auto">
            <DashboardSidebar isMobileView={false} />
          </div>
        </aside>
      )}
      
      <main className="flex-grow p-4 md:p-6 lg:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
