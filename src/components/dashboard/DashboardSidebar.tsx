
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SheetClose } from "@/components/ui/sheet";
import { LayoutGrid, Waypoints, Cloud, Settings, Server, Users, Cog, ShieldCheck, KeyRound, BarChart3 } from "lucide-react";
import type { Dispatch, SetStateAction } from 'react';
import { cn } from "@/lib/utils";

interface DashboardSidebarNavProps {
  isMobile: boolean; 
  onLinkClick?: () => void; 
}

// Updated to reflect a broader dashboard navigation
const mainDashboardNavItems = [
  { title: "Aperçu", href: "/dashboard", icon: LayoutGrid },
  { title: "Mes Tunnels", href: "/dashboard/tunnels", icon: Waypoints },
  { title: "Mon Cloud", href: "/dashboard/cloud", icon: Cloud, disabled: false, soon: true },
  { title: "Gestion API", href: "/dashboard/api-management", icon: KeyRound, disabled: false, soon: true }, // Placeholder for API token management
];

const accountNavItems = [
    { title: "Paramètres du Compte", href: "/settings/profile", icon: Settings },
];

// Example for a future admin section
const adminNavItems = [
  { title: "Panel Admin", href: "/admin", icon: ShieldCheck, adminOnly: true, soon: true },
  { title: "Statistiques PANDA", href: "/admin/stats", icon: BarChart3, adminOnly: true, soon: true },
];


export function DashboardSidebarNav({ isMobile, onLinkClick }: DashboardSidebarNavProps) {
  const pathname = usePathname();
  const NavLinkWrapper = isMobile ? SheetClose : React.Fragment;

  const renderNavItems = (items: typeof mainDashboardNavItems) => {
    return items.map((item) => {
      // Basic check for adminOnly, could be expanded with actual role checking from context
      if (item.adminOnly && process.env.NEXT_PUBLIC_ADMIN_EMAIL !== "enzo.prados@gmail.com") { // Example, replace with actual role check
          // return null; 
          // For now, let's show it but indicate it's admin only if we don't have a role system yet
      }

      const LinkComponent = (
        <Button
          key={item.title}
          variant={pathname.startsWith(item.href) ? "default" : "ghost"}
          className={cn(
            "w-full justify-start text-base py-3 sm:py-2 sm:text-sm",
            pathname.startsWith(item.href) && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
            item.disabled && "opacity-50 cursor-not-allowed"
          )}
          asChild={!item.disabled}
          disabled={item.disabled}
          onClick={item.disabled ? (e) => e.preventDefault() : onLinkClick}
        >
          <Link href={item.disabled ? "#" : item.href}>
            <item.icon className="mr-3 h-5 w-5" />
            {item.title}
            {item.soon && <span className="ml-auto text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">Bientôt</span>}
            {item.adminOnly && <span className="ml-auto text-xs bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full">Admin</span>}
          </Link>
        </Button>
      );
      return isMobile ? <NavLinkWrapper key={`${item.title}-wrapper-${Math.random()}`} asChild>{LinkComponent}</NavLinkWrapper> : <div key={`${item.title}-div-wrapper-${Math.random()}`}>{LinkComponent}</div>;
    });
  };

  return (
    <div className="flex flex-col h-full">
      <nav className="flex flex-col gap-2 p-4">
        {renderNavItems(mainDashboardNavItems)}
      </nav>
      <div className="mt-auto"> {/* Pushes account and admin links to the bottom */}
        <nav className="flex flex-col gap-2 p-4 border-t">
            {renderNavItems(accountNavItems)}
            {/* Conditional rendering for admin items can be added here based on user role later */}
            {renderNavItems(adminNavItems)}
        </nav>
      </div>
    </div>
  );
}

interface DashboardSidebarProps {
  isMobileView: boolean;
  setIsOpen?: Dispatch<SetStateAction<boolean>>; // For closing sheet on mobile
}

export default function DashboardSidebar({ isMobileView, setIsOpen }: DashboardSidebarProps) {
  return (
    <div className="flex flex-col h-full bg-card"> {/* Ensure full height for sticky effect */}
      <div className="p-6 border-b">
        <h2 className="text-2xl font-headline text-primary">Menu PANDA</h2>
      </div>
      <DashboardSidebarNav 
        isMobile={isMobileView} 
        onLinkClick={isMobileView && setIsOpen ? () => setIsOpen(false) : undefined}
      />
    </div>
  );
}
