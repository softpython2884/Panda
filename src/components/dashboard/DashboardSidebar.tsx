
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { LayoutGrid, Waypoints, Cloud, X } from "lucide-react";
import type { Dispatch, SetStateAction } from 'react';
import { cn } from "@/lib/utils";

interface DashboardSidebarProps {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

const sidebarNavItems = [
  { title: "Aperçu", href: "/dashboard", icon: LayoutGrid },
  { title: "Mes Tunnels", href: "/dashboard/tunnels", icon: Waypoints },
  { title: "Mon Cloud", href: "/dashboard/cloud", icon: Cloud, disabled: true, soon: true },
];

export default function DashboardSidebar({ isOpen, setIsOpen }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side="left" className="w-[280px] sm:w-[320px] bg-card p-0">
        <SheetHeader className="p-6 border-b">
          <SheetTitle className="text-2xl font-headline text-primary">PANDA Dashboard</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-2 p-4">
          {sidebarNavItems.map((item) => (
            <SheetClose asChild key={item.title}>
              <Button
                variant={pathname === item.href ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start text-base py-6",
                  pathname === item.href && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
                  item.disabled && "opacity-50 cursor-not-allowed"
                )}
                asChild={!item.disabled}
                disabled={item.disabled}
                onClick={item.disabled ? (e) => e.preventDefault() : undefined}
              >
                <Link href={item.disabled ? "#" : item.href}>
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.title}
                  {item.soon && <span className="ml-auto text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">Bientôt</span>}
                </Link>
              </Button>
            </SheetClose>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
