
"use client";
import type { ReactNode } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2, UserCircle, KeyRound, LayoutDashboard } from "lucide-react"; 
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const sidebarNavItems = [
  { title: "Mon Profil", href: "/settings/profile", icon: UserCircle },
  { title: "Mes Tokens d'API", href: "/settings/api-tokens", icon: KeyRound },
  { title: "Tableau de Bord", href: "/dashboard", icon: LayoutDashboard }, 
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const { user, isCheckingAuthSession } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isCheckingAuthSession && !user) {
      router.push('/auth/login?redirect=/settings/profile');
    }
  }, [user, isCheckingAuthSession, router]);

  if (isCheckingAuthSession || (!user && isCheckingAuthSession && typeof window !== 'undefined')) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading settings...</p>
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
    <div className="flex flex-col md:flex-row gap-8 min-h-[calc(100vh-var(--navbar-height,100px)-2rem)]">
      <aside className="md:w-64 lg:w-72 xl:w-80 flex-shrink-0">
        <div className="sticky top-24 space-y-4"> 
          <h2 className="text-xl font-headline font-semibold px-4">Paramètres</h2>
          <nav className="flex flex-col gap-1 px-2">
            {sidebarNavItems.map((item) => (
              <Button
                key={item.title}
                variant={pathname.startsWith(item.href) ? "default" : "ghost"} 
                className={cn(
                  "w-full justify-start",
                  pathname.startsWith(item.href) && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                )}
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-5 w-5" />
                  {item.title}
                </Link>
              </Button>
            ))}
          </nav>
        </div>
      </aside>
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
}
