
"use client";
import type { ReactNode } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, ShieldCheck, Users, Server, Settings, BarChart3, ListOrdered, MailPlus } from "lucide-react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const adminSidebarNavItems = [
  { title: "Admin Dashboard", href: "/admin", icon: ShieldCheck },
  { title: "User Management", href: "/admin/users", icon: Users },
  { title: "Service Management", href: "/admin/services", icon: Server },
  { title: "Command Management", href: "/admin/commands", icon: ListOrdered },
  { title: "Envoyer Notification", href: "/admin/notifications/send", icon: MailPlus },
  // { title: "System Settings", href: "/admin/settings", icon: Settings },
  // { title: "Analytics", href: "/admin/analytics", icon: BarChart3 },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isCheckingAuthSession } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isCheckingAuthSession) {
      if (!user) {
        router.push('/auth/login?redirect=/admin');
      } else if (user.role !== 'ADMIN') {
        router.push('/dashboard?error=forbidden'); 
      }
    }
  }, [user, isCheckingAuthSession, router]);

  if (isCheckingAuthSession || !user || (user && user.role !== 'ADMIN')) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading Admin Area...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-8 min-h-[calc(100vh-var(--navbar-height,100px)-2rem)]">
      <aside className="md:w-64 lg:w-72 xl:w-80 flex-shrink-0">
        <div className="sticky top-24 space-y-4">
          <h2 className="text-xl font-headline font-semibold px-4 text-destructive">Admin Panel</h2>
          <nav className="flex flex-col gap-1 px-2">
            {adminSidebarNavItems.map((item) => (
              <Button
                key={item.title}
                variant={pathname === item.href ? "destructive" : "ghost"}
                className={cn(
                  "w-full justify-start",
                   pathname === item.href && "bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
