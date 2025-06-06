
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Wifi, ShieldCheck, Briefcase, Zap, Construction, UserCheck, Infinity as InfinityIcon, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { RolesConfig, UserRoleDisplayConfig } from "@/lib/schemas";

export default function VpnPage() {
  const { user } = useAuth();
  const userRole = user?.role || 'FREE';
  const userQuotaConfig = RolesConfig[userRole];

  const vpnOffers = [
    {
      title: "VPN PANDA Basique",
      icon: UserCheck,
      description: "Connexion VPN rapide et sécurisée pour un usage personnel quotidien. Idéal pour protéger votre navigation et accéder à du contenu géo-restreint.",
      gradeRequired: "PREMIUM",
      features: [
        "Serveurs rapides dans plusieurs régions",
        "Chiffrement robuste",
        "Politique de non-conservation des logs",
        "Facile à configurer sur tous vos appareils",
      ],
    },
    {
      title: "VPN PANDA Entreprise",
      icon: Briefcase,
      description: "Connectez de manière sécurisée les appareils de vos employés à votre réseau local d'entreprise ou à vos serveurs distants. Facilite le télétravail et l'accès aux ressources internes.",
      gradeRequired: "ENDIUM",
      features: [
        "Accès VPN Site-to-Site et Client-to-Site",
        "Adresses IP dédiées (optionnel)",
        "Gestion centralisée des accès utilisateurs",
        "Support prioritaire",
      ],
    },
    {
      title: "VPN PANDA Anonymat Avancé",
      icon: ShieldAlert,
      description: "Pour une confidentialité maximale. Votre trafic est routé à travers plusieurs serveurs VPN (multi-hop) et votre adresse IP change dynamiquement toutes les 5 minutes.",
      gradeRequired: "PREMIUM_PLUS",
      features: [
        "Technologie Multi-Hop",
        "Changement d'IP dynamique (toutes les 5 min)",
        "Protection avancée contre le tracking",
        "Kill Switch intégré",
      ],
    },
  ];
  
  const canAccessVpn = userQuotaConfig.maxVpnConnections > 0 || userQuotaConfig.maxVpnConnections === Infinity;

  return (
    <div className="space-y-8 flex flex-col items-center justify-center text-center min-h-[calc(100vh-300px)]">
      <Construction className="h-24 w-24 text-primary mb-6" />
      <h1 className="text-4xl font-headline font-bold text-primary">Service VPN PANDA</h1>
      <p className="text-xl text-muted-foreground max-w-2xl">
        Cette section est en cours de développement. Découvrez bientôt nos solutions VPN sécurisées et performantes.
      </p>

      <Alert className="w-full max-w-lg mt-4">
        <Wifi className="h-5 w-5" />
        <AlertTitle>Vos Quotas de Connexions VPN</AlertTitle>
        <AlertDescription className="inline-flex items-center gap-1">
          Votre grade actuel ({UserRoleDisplayConfig[userRole].label}) vous donne droit à :
          {userQuotaConfig.maxVpnConnections === Infinity ? (
            <span className="inline-flex items-center gap-1 font-semibold text-green-600"><InfinityIcon className="h-4 w-4" /></span>
          ) : (
            <strong className="text-primary">{userQuotaConfig.maxVpnConnections} connexion(s) active(s)</strong>
          )}
          .
          {!canAccessVpn && userQuotaConfig.maxVpnConnections !== Infinity && <span className="ml-1 text-sm text-destructive"> (Mise à niveau requise pour accéder au VPN)</span>}
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-6 w-full max-w-5xl mt-8">
        {vpnOffers.map((offer) => (
          <Card key={offer.title} className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
            <CardHeader className="text-center">
              <offer.icon className="h-12 w-12 text-accent mx-auto mb-3" />
              <CardTitle className="font-headline text-xl">{offer.title}</CardTitle>
              <CardDescription>Grade requis : <span className={`font-semibold ${UserRoleDisplayConfig[offer.gradeRequired as keyof typeof UserRoleDisplayConfig].className}`}>{UserRoleDisplayConfig[offer.gradeRequired as keyof typeof UserRoleDisplayConfig].label}</span></CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground mb-3">{offer.description}</p>
              <ul className="list-disc list-inside text-left text-sm space-y-1 text-muted-foreground">
                {offer.features.map(feature => <li key={feature}>{feature}</li>)}
              </ul>
            </CardContent>
            <CardContent>
                 <Button disabled className="w-full mt-auto">
                    Bientôt Disponible
                </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button asChild variant="outline" className="mt-12">
        <Link href="/dashboard">Retour au Tableau de Bord</Link>
      </Button>
      <p className="text-xs text-muted-foreground mt-10 italic">PANDA: Private Virtual Network & Data Anonymization</p>
    </div>
  );
}
