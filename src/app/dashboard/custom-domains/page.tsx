
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Globe, Construction, Settings2, ShieldCheck, BadgePercent } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function CustomDomainsPage() {
  return (
    <div className="space-y-8 flex flex-col items-center justify-center text-center min-h-[calc(100vh-300px)]">
       <Construction className="h-24 w-24 text-primary mb-6" />
      <h1 className="text-4xl font-headline font-bold text-primary">Enregistrement & Gestion de Domaines Personnalisés</h1>
      <p className="text-xl text-muted-foreground max-w-2xl">
        Cette section est en cours de développement. Elle permettra aux utilisateurs avec le grade <strong className="text-yellow-500">ENDIUM</strong> d'enregistrer de nouveaux noms de domaine (ex: .fr, .com) ou de transférer et gérer des domaines existants via PANDA.
      </p>
      <Card className="w-full max-w-lg mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center justify-center gap-2">
            <Globe className="h-7 w-7 text-accent" /> Bientôt Disponible
          </CardTitle>
          <CardDescription>Enregistrez, transférez et gérez vos propres noms de domaine.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-left">
          <Alert>
            <ShieldCheck className="h-5 w-5" />
            <AlertTitle className="font-semibold">Fonctionnalité pour Grade ENDIUM</AlertTitle>
            <AlertDescription>
              L'enregistrement et la gestion de noms de domaine personnalisés nécessiteront un grade utilisateur <strong className="text-yellow-600 font-semibold">ENDIUM</strong>.
            </AlertDescription>
          </Alert>
           <p className="text-sm text-muted-foreground">
            Imaginez pouvoir rechercher la disponibilité d'un nom de domaine, l'enregistrer, et le lier directement à vos services PANDA (tunnels, mini-serveurs, VMs) ou gérer sa zone DNS avancée (voir section "Gestion DNS Avancée").
          </p>
          <Alert variant="default">
             <Settings2 className="h-5 w-5" />
            <AlertTitle>Intégration Possible</AlertTitle>
            <AlertDescription>
              Nous explorons l'intégration avec des registrars de domaines (potentiellement via des API comme OVH) ou un système de demande manuelle pour l'enregistrement et la gestion.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
       <Button asChild variant="outline" className="mt-8">
         <Link href="/dashboard">Retour au Tableau de Bord</Link>
       </Button>
       <p className="text-xs text-muted-foreground mt-10 italic">PANDA: Personalized Domain Name & Addressing</p>
    </div>
  );
}
