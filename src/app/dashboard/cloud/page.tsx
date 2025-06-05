
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CloudCog, Construction, Share2, Gauge, Infinity as InfinityIcon, Server } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { RolesConfig } from "@/lib/schemas";

export default function CloudDashboardPage() {
  const { user } = useAuth();
  const userQuotaConfig = user ? RolesConfig[user.role] : RolesConfig.FREE;

  return (
    <div className="space-y-8 flex flex-col items-center justify-center text-center min-h-[calc(100vh-300px)]">
       <Construction className="h-24 w-24 text-primary mb-6" />
      <h1 className="text-4xl font-headline font-bold text-primary">Espace Cloud PANDA</h1>
      <p className="text-xl text-muted-foreground max-w-2xl">
        Cette section est en cours de développement. Hébergez vos propres serveurs cloud et partagez des fichiers.
      </p>
      <Card className="w-full max-w-md mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Bientôt Disponible</CardTitle>
          <CardDescription>Gérez vos serveurs cloud personnels et vos fichiers, avec un stockage illimité par serveur.</CardDescription>
        </CardHeader>
        <CardContent>
          <CloudCog className="h-16 w-16 text-accent mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            Nous travaillons activement à l'intégration de fonctionnalités de stockage cloud sécurisé et facile à utiliser.
          </p>
        </CardContent>
      </Card>

      <Alert className="w-full max-w-md mt-4">
        <Server className="h-5 w-5" />
        <AlertTitle>Vos Quotas de Serveurs Cloud</AlertTitle>
        <AlertDescription>
          Votre grade actuel vous permet de créer jusqu'à : {" "}
          {userQuotaConfig.maxCloudServers === Infinity ? (
            <span className="inline-flex items-center gap-1 font-semibold"><InfinityIcon className="h-4 w-4" /> Nombre Illimité de serveurs cloud</span>
          ) : (
            <strong className="text-primary">{userQuotaConfig.maxCloudServers} serveur(s) cloud</strong>
          )}
          . Chaque serveur cloud dispose d'un espace de stockage illimité.
        </AlertDescription>
      </Alert>

      <Alert className="w-full max-w-md mt-4">
        <Share2 className="h-5 w-5" />
        <AlertTitle>Partage de Serveurs Cloud (Prochainement)</AlertTitle>
        <AlertDescription>
          Vous pourrez bientôt partager l'accès à vos serveurs cloud ou fichiers spécifiques avec d'autres utilisateurs PANDA ou via des liens publics sécurisés.
          La gestion des permissions et des liens de partage sera disponible ici.
        </AlertDescription>
      </Alert>

       <Button asChild variant="outline" className="mt-8">
         <Link href="/dashboard">Retour à l'Aperçu</Link>
       </Button>
    </div>
  );
}
