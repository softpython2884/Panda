
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SheetClose } from "@/components/ui/sheet"; // SheetClose reste utile si ce composant est dans une Sheet
import { LayoutGrid, Waypoints, Cloud, Settings, Server, Users } from "lucide-react";
import type { Dispatch, SetStateAction } from 'react';
import { cn } from "@/lib/utils";

interface DashboardSidebarNavProps {
  isMobile: boolean; // Pour savoir si on doit utiliser SheetClose
  onLinkClick?: () => void; // Pour fermer la Sheet sur mobile après un clic
}

const sidebarNavItems = [
  { title: "Aperçu", href: "/dashboard", icon: LayoutGrid },
  { title: "Mes Tunnels", href: "/dashboard/tunnels", icon: Waypoints },
  { title: "Mon Cloud", href: "/dashboard/cloud", icon: Cloud, disabled: false, soon: true }, // Rendu cliquable mais avec "Bientôt"
  // Futurs liens possibles pour l'admin ou des fonctionnalités avancées:
  // { title: "Gestion API", href: "/dashboard/api-management", icon: Server },
  // { title: "Utilisateurs (Admin)", href: "/admin/users", icon: Users, adminOnly: true },
  { title: "Paramètres du Compte", href: "/settings/profile", icon: Settings },
];

export function DashboardSidebarNav({ isMobile, onLinkClick }: DashboardSidebarNavProps) {
  const pathname = usePathname();

  const NavLinkWrapper = isMobile ? SheetClose : React.Fragment;

  return (
    <nav className="flex flex-col gap-2 p-4">
      {sidebarNavItems.map((item) => {
        const LinkComponent = (
          <Button
            key={item.title}
            variant={pathname === item.href ? "default" : "ghost"}
            className={cn(
              "w-full justify-start text-base py-3 sm:py-2 sm:text-sm", // Ajustement taille pour desktop
              pathname === item.href && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
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
            </Link>
          </Button>
        );

        return isMobile ? <NavLinkWrapper key={`${item.title}-wrapper`} asChild>{LinkComponent}</NavLinkWrapper> : <div key={`${item.title}-div-wrapper`}>{LinkComponent}</div>;
      })}
    </nav>
  );
}

interface DashboardSidebarProps {
  isOpen?: boolean; // Optionnel car plus toujours dans une Sheet
  setIsOpen?: Dispatch<SetStateAction<boolean>>; // Optionnel
  isMobileView: boolean;
}

export default function DashboardSidebar({ isOpen, setIsOpen, isMobileView }: DashboardSidebarProps) {
  return (
    <>
      <div className="p-6 border-b">
        <h2 className="text-2xl font-headline text-primary">Menu PANDA</h2>
      </div>
      <DashboardSidebarNav 
        isMobile={isMobileView} 
        onLinkClick={isMobileView && setIsOpen ? () => setIsOpen(false) : undefined}
      />
    </>
  );
}
