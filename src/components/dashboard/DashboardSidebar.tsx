
"use client";

import React from 'react';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SheetClose } from "@/components/ui/sheet";
import { 
  LayoutGrid, Waypoints, Cloud, Settings, ShieldCheck, KeyRound, 
  TerminalSquare, Puzzle, DatabaseZap, ServerCog, Mail, Network, Globe, Sparkles, Link as LinkIcon, Layers, Server, Infinity as InfinityIcon
} from "lucide-react";
import type { Dispatch, SetStateAction } from 'react';
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  disabled?: boolean;
  soon?: boolean;
  adminOnly?: boolean;
  premiumFeature?: boolean;
  endiumFeature?: boolean; 
}

interface NavGroup {
  groupTitle: string;
  items: NavItem[];
  defaultOpen?: boolean;
  groupIcon?: React.ElementType;
  groupDescription?: string; // Cette propriété est utilisée pour la description du groupe
}

const sidebarNavGroups: NavGroup[] = [
  {
    groupTitle: "Navigation Principale",
    groupIcon: LayoutGrid,
    defaultOpen: true,
    items: [
      { title: "Aperçu", href: "/dashboard", icon: LayoutGrid },
      { title: "Mes Tunnels", href: "/dashboard/tunnels", icon: Waypoints },
    ],
  },
  {
    groupTitle: "Accès & Outils Distants",
    groupIcon: TerminalSquare,
    items: [
      { title: "SSH in Browser", href: "/dashboard/ssh-terminal", icon: TerminalSquare, soon: true },
    ],
  },
  {
    groupTitle: "Connectivité & Réseau",
    groupIcon: Network,
    items: [
      { title: "Proxy Personnalisé", href: "/dashboard/custom-proxy", icon: LinkIcon, soon: true },
    ],
  },
  {
    groupTitle: "Hébergement & Cloud Simple",
    groupIcon: Cloud,
    items: [
      { title: "Mon Cloud PANDA", href: "/dashboard/cloud", icon: Cloud, soon: true },
      { title: "Hébergement & Partage DB", href: "/dashboard/database-sharing", icon: DatabaseZap, soon: true },
      { title: "Mini-Serveurs", href: "/dashboard/mini-servers", icon: ServerCog, soon: true },
    ],
  },
  {
    groupTitle: "Hébergement Spécialisé & DNS",
    groupIcon: Layers,
    // groupDescription: "Services avancés (Grade ENDIUM requis)", // Supprimé comme demandé
    items: [
      { title: "Webmail PANDA", href: "/dashboard/webmail", icon: Mail, soon: true, endiumFeature: true },
      { title: "Gestion DNS Avancée", href: "/dashboard/dns-management", icon: Globe, soon: true, premiumFeature: true, endiumFeature: true },
      { title: "Domaines Personnalisés", href: "/dashboard/custom-domains", icon: Globe, soon: true, endiumFeature: true },
      { title: "Machines Virtuelles (VMs)", href: "/dashboard/virtual-machines", icon: Server, soon: true, endiumFeature: true },
    ]
  },
  {
    groupTitle: "Développement & Intégrations",
    groupIcon: Sparkles,
    items: [
      { title: "PANDA AI Studio", href: "/dashboard/ai-studio", icon: Sparkles, soon: true },
      { title: "Intégrations Services", href: "/dashboard/integrations", icon: Puzzle, soon: true },
      { title: "Gestion API (Client)", href: "/dashboard/api-management", icon: KeyRound, soon: true },
    ],
  },
];

const accountNavItems: NavItem[] = [
    { title: "Paramètres du Compte", href: "/settings/profile", icon: Settings },
];

const adminNavItems: NavItem[] = [
  { title: "Panel Admin", href: "/admin", icon: ShieldCheck, adminOnly: true },
];


interface DashboardSidebarNavProps {
  isMobile: boolean; 
  onLinkClick?: () => void; 
}

export function DashboardSidebarNav({ isMobile, onLinkClick }: DashboardSidebarNavProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const NavLinkWrapper = isMobile ? SheetClose : React.Fragment;

  const renderNavItem = (item: NavItem, itemKey: string) => {
    if (item.adminOnly && (!user || user.role !== 'ADMIN')) {
        return null; 
    }
    
    const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
    
    const LinkComponent = (
      <Button
        key={itemKey}
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
          <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
          <span className="truncate">{item.title}</span>
          {item.soon && <span className="ml-auto text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full whitespace-nowrap">Bientôt</span>}
          {item.endiumFeature && !item.soon && <span className="ml-auto text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full whitespace-nowrap">ENDIUM</span>}
          {item.premiumFeature && !item.endiumFeature && !item.soon && <span className="ml-auto text-xs bg-blue-400 text-blue-900 px-2 py-0.5 rounded-full whitespace-nowrap">PREMIUM</span>}
        </Link>
      </Button>
    );
    return isMobile ? <NavLinkWrapper key={`${itemKey}-wrapper`} asChild>{LinkComponent}</NavLinkWrapper> : <div key={`${itemKey}-wrapper`}>{LinkComponent}</div>;
  };

  const defaultOpenAccordionItems = sidebarNavGroups.filter(g => g.defaultOpen).map(g => g.groupTitle);

  return (
    <div className="flex flex-col h-full">
      <Accordion type="multiple" defaultValue={defaultOpenAccordionItems} className="w-full px-4 py-2 space-y-1 flex-grow overflow-y-auto">
        {sidebarNavGroups.map((group, groupIndex) => (
          <AccordionItem value={group.groupTitle} key={`group-${group.groupTitle}-${groupIndex}`} className="border-b-0">
            <AccordionTrigger className="py-2 px-2 text-sm font-semibold hover:bg-muted/50 rounded-md hover:no-underline [&[data-state=open]>svg]:text-primary">
              <div className="flex items-center gap-2">
                {group.groupIcon && <group.groupIcon className="h-5 w-5 text-muted-foreground group-data-[state=open]:text-primary transition-colors" />}
                <span>{group.groupTitle}</span>
                 {group.groupDescription && <span className="text-xs text-muted-foreground font-normal ml-1">({group.groupDescription})</span>}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-1 pb-0 pl-3 pr-1 space-y-1">
              {group.items.map((item, itemIndex) => renderNavItem(item, `group-${groupIndex}-item-${itemIndex}`))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      
      <div className="mt-auto"> 
        <nav className="flex flex-col gap-1 p-4 border-t">
            {accountNavItems.map((item, index) => renderNavItem(item, `account-item-${index}`))}
            {user && user.role === 'ADMIN' && adminNavItems.map((item, index) => renderNavItem(item, `admin-item-${index}`))}
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
      <DashboardSidebarNav 
        isMobile={isMobileView} 
        onLinkClick={isMobileView && setIsOpen ? () => setIsOpen(false) : undefined}
      />
    </div>
  );
}
