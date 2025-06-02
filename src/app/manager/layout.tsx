
"use client"; 
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import type { ReactNode } from 'react';
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function ManagerLayout({ children }: { children: ReactNode }) {
  const { user, isCheckingAuthSession } = useAuth(); // Use isCheckingAuthSession
  const router = useRouter();

  useEffect(() => {
    if (!isCheckingAuthSession && !user) { // Check based on new loading state
      router.push('/auth/login?redirect=/manager');
    }
  }, [user, isCheckingAuthSession, router]);

  if (isCheckingAuthSession || (!user && isCheckingAuthSession)) { // Show loader if checking or if check isn't done and no user yet
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading manager...</p>
      </div>
    );
  }

  if (!user) { // Fallback
     return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Redirecting to login...</p>
      </div>
    );
  }
  
  return <>{children}</>;
}
