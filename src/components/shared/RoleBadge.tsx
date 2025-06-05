
"use client";

import type { UserRole } from "@/lib/schemas";
import { UserRoleDisplayConfig } from "@/lib/schemas";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Gem, Crown, Star } from "lucide-react"; // Example icons

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

const iconMap: Record<UserRole, React.ElementType | null> = {
    ADMIN: ShieldCheck,
    ENDIUM: Crown,
    PREMIUM_PLUS: Gem,
    PREMIUM: Star,
    FREE: null,
};

export default function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = UserRoleDisplayConfig[role] || UserRoleDisplayConfig.FREE;
  const IconComponent = iconMap[role];

  return (
    <Badge variant="outline" className={`${config.className} ${className || ''} font-semibold text-xs px-2.5 py-1 border`}>
      {IconComponent && <IconComponent className="mr-1.5 h-3.5 w-3.5" />}
      {config.label}
    </Badge>
  );
}
