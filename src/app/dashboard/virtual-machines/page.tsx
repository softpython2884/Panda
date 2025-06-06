
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { HardDrive, Construction, ServerCog, ShieldCheck, Gauge, Server as ServerIcon } from "lucide-react"; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function VirtualMachinesPage() {
  return (
    <div className="space-y-8 flex flex-col items-center justify-center text-center min-h-[calc(100vh-300px)]">
       <Construction className="h-24 w-24 text-primary mb-6" />
      <h1 className="text-4xl font-headline font-bold text-primary">Machines Virtuelles (VMs) PANDA</h1>
      <p className="text-xl text-muted-foreground max-w-2xl">
        Cette section est en cours de développement. Elle permettra aux utilisateurs (grade <strong className="text-yellow-500">ENDIUM</strong> requis) de déployer et gérer des machines virtuelles sur l'infrastructure PANDA.
      </p>
      <Card className="w-full max-w-lg mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center justify-center gap-2">
            <ServerIcon className="h-7 w-7 text-accent" /> Bientôt Disponible
          </CardTitle>
          <CardDescription>Déployez vos propres serveurs virtuels en quelques clics.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-left">
          <Alert>
            <ShieldCheck className="h-5 w-5" />
            <AlertTitle className="font-semibold">Fonctionnalité pour Grade ENDIUM</AlertTitle>
            <AlertDescription>
              Le déploiement et la gestion de Machines Virtuelles nécessiteront un grade utilisateur <strong className="text-yellow-600 font-semibold">ENDIUM</strong>.
            </AlertDescription>
          </Alert>
           <p className="text-sm text-muted-foreground">
            Vous pourrez choisir parmi différentes configurations de VM (CPU, RAM, Stockage), sélectionner un système d'exploitation, et obtenir un accès SSH pour une gestion complète.
          </p>
          <Alert variant="default">
             <Gauge className="h-5 w-5" />
            <AlertTitle>Gestion des Ressources</AlertTitle>
            <AlertDescription>
              Les ressources allouées (nombre de VMs, puissance, etc.) seront basées sur votre grade utilisateur et les options choisies.
              Un monitoring de base de l'utilisation des ressources de vos VMs sera également disponible.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
       <Button asChild variant="outline" className="mt-8">
         <Link href="/dashboard">Retour au Tableau de Bord</Link>
       </Button>
       <p className="text-xs text-muted-foreground mt-10 italic">PANDA: Personal Virtual Machine & Networked Deployment Area</p>
    </div>
  );
}
