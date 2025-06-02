
"use client"; 
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import type { ReactNode } from 'react';
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isCheckingAuthSession } = useAuth(); // Use isCheckingAuthSession
  const router = useRouter();

  useEffect(() => {
    if (!isCheckingAuthSession && !user) { // Check based on new loading state
      router.push('/auth/login?redirect=/dashboard');
    }
  }, [user, isCheckingAuthSession, router]);

  if (isCheckingAuthSession || (!user && isCheckingAuthSession)) { // Show loader if checking or if check isn't done and no user yet
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading dashboard...</p>
      </div>
    );
  }
  
  // If auth check is done and there's still no user, the effect above would have redirected.
  // If we reach here and there's no user, it's an edge case, but content shouldn't render.
  // However, the useEffect should handle the redirect reliably.
  // So, if !isCheckingAuthSession && user, then we render children.
  if (!user) { // Fallback if somehow redirect didn't fire but auth check is done and no user
     return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Redirecting to login...</p>
      </div>
    );
  }


  return <>{children}</>;
}
