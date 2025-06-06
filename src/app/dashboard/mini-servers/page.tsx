
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ServerCog, Construction, Container, Gauge, Infinity as InfinityIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { RolesConfig, UserRoleDisplayConfig } from "@/lib/schemas";

export default function MiniServersPage() {
  const { user } = useAuth();
  const userRole = user?.role || 'FREE';
  const userQuotaConfig = RolesConfig[userRole];

  return (
    <div className="space-y-8 flex flex-col items-center justify-center text-center min-h-[calc(100vh-300px)]">
       <Construction className="h-24 w-24 text-primary mb-6" />
      <h1 className="text-4xl font-headline font-bold text-primary">Mini-Serveurs PANDA</h1>
      <p className="text-xl text-muted-foreground max-w-2xl">
        Cette section est en cours de développement. Hébergez et gérez de petites applications (Node.js, Python, etc.) directement sur la plateforme PANDA.
      </p>
      <Card className="w-full max-w-md mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Bientôt Disponible</CardTitle>
          <CardDescription>Déployez vos scripts et petites applications web en quelques clics.</CardDescription>
        </CardHeader>
        <CardContent>
          <Container className="h-16 w-16 text-accent mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            Nous construisons une infrastructure pour vous permettre d'exécuter des environnements conteneurisés légers.
          </p>
        </CardContent>
      </Card>

      <Alert className="w-full max-w-md mt-4">
        <Gauge className="h-5 w-5" />
        <AlertTitle>Vos Quotas de Mini-Serveurs</AlertTitle>
        <AlertDescription>
          <span className="flex items-center gap-1">
            Votre grade actuel ({UserRoleDisplayConfig[userRole].label}) vous permet de déployer jusqu'à :&nbsp;
            {userQuotaConfig.maxMiniServers === Infinity ? (
              <InfinityIcon className="h-4 w-4 text-green-600" />
            ) : (
              <strong className="text-primary">{userQuotaConfig.maxMiniServers}</strong>
            )}
            &nbsp;mini-serveur(s).
          </span>
        </AlertDescription>
      </Alert>

       <Button asChild variant="outline" className="mt-8">
         <Link href="/dashboard">Retour au Tableau de Bord</Link>
       </Button>
       <p className="text-xs text-muted-foreground mt-10 italic">
        <span className="text-primary">P</span>rogrammable <span className="text-primary">A</span>nywhere <span className="text-primary">N</span>ode <span className="text-primary">D</span>istribution <span className="text-primary">A</span>ppliance
      </p>
    </div>
  );
}
    
