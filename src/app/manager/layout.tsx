
"use client"; // Required for useAuth hook
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import type { ReactNode } from 'react';
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function ManagerLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login?redirect=/manager');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading manager...</p>
      </div>
    );
  }
  // Manager uses Raleway for titles, Inter for body. This is handled by global theme.
  // Manager specific colors: Primary: HSL(140, 45%, 45%), Background: HSL(0, 0%, 97%), Accent (delete): HSL(10, 80%, 60%)
  // These are also set in globals.css
  return <>{children}</>;
}
