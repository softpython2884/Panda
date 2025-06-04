
"use client";

import React from 'react';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SheetClose } from "@/components/ui/sheet";
import { LayoutGrid, Waypoints, Cloud, Settings, ShieldCheck, KeyRound } from "lucide-react";
import type { Dispatch, SetStateAction } from 'react';
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardSidebarNavProps {
  isMobile: boolean; 
  onLinkClick?: () => void; 
}

const mainDashboardNavItems = [
  { title: "Aperçu", href: "/dashboard", icon: LayoutGrid },
  { title: "Mes Tunnels", href: "/dashboard/tunnels", icon: Waypoints },
  { title: "Mon Cloud", href: "/dashboard/cloud", icon: Cloud, disabled: false, soon: true },
  { title: "Gestion API (Client)", href: "/dashboard/api-management", icon: KeyRound, disabled: false, soon: true },
];

const accountNavItems = [
    { title: "Paramètres du Compte", href: "/settings/profile", icon: Settings },
];

const adminNavItems = [
  { title: "Panel Admin", href: "/admin", icon: ShieldCheck, adminOnly: true },
];


export function DashboardSidebarNav({ isMobile, onLinkClick }: DashboardSidebarNavProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const NavLinkWrapper = isMobile ? SheetClose : React.Fragment;

  const renderNavItems = (items: typeof mainDashboardNavItems | typeof accountNavItems | typeof adminNavItems) => {
    return items.map((item) => {
      if (item.adminOnly && (!user || user.role !== 'ADMIN')) {
          return null; 
      }

      const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
      
      const LinkComponent = (
        <Button
          key={item.title}
          variant={isActive ? "default" : "ghost"}
          className={cn(
            "w-full justify-start text-base py-3 sm:py-2 sm:text-sm",
            isActive && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
            item.disabled && "opacity-50 cursor-not-allowed",
            item.adminOnly && user?.role === 'ADMIN' && isActive && "bg-destructive text-destructive-foreground hover:bg-destructive/90"
          )}
          asChild={!item.disabled}
          disabled={item.disabled}
          onClick={item.disabled ? (e) => e.preventDefault() : onLinkClick}
        >
          <Link href={item.disabled ? "#" : item.href}>
            <item.icon className="mr-3 h-5 w-5" />
            {item.title}
            {item.soon && <span className="ml-auto text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">Bientôt</span>}
          </Link>
        </Button>
      );
      // Ensure unique keys for wrapper components
      return isMobile ? <NavLinkWrapper key={`${item.href}-mobile-wrapper`} asChild>{LinkComponent}</NavLinkWrapper> : <div key={`${item.href}-desktop-wrapper`}>{LinkComponent}</div>;
    });
  };

  return (
    <div className="flex flex-col h-full">
      <nav className="flex flex-col gap-2 p-4">
        {renderNavItems(mainDashboardNavItems)}
      </nav>
      <div className="mt-auto"> 
        <nav className="flex flex-col gap-2 p-4 border-t">
            {renderNavItems(accountNavItems)}
            {user && user.role === 'ADMIN' && renderNavItems(adminNavItems)}
        </nav>
      </div>
    </div>
  );
}

interface DashboardSidebarProps {
  isMobileView: boolean;
  setIsOpen?: Dispatch<SetStateAction<boolean>>; 
}

export default function DashboardSidebar({ isMobileView, setIsOpen }: DashboardSidebarProps) {
  return (
    <div className="flex flex-col h-full bg-card"> 
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
