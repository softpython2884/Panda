
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Network, Construction, Link2 as LinkIcon, Gauge, Infinity as InfinityIcon } from "lucide-react"; // Changed Link to LinkIcon
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { RolesConfig } from "@/lib/schemas";

export default function CustomProxyPage() {
  const { user } = useAuth();
  const userQuotaConfig = user ? RolesConfig[user.role] : RolesConfig.FREE;

  return (
    <div className="space-y-8 flex flex-col items-center justify-center text-center min-h-[calc(100vh-300px)]">
       <Construction className="h-24 w-24 text-primary mb-6" />
      <h1 className="text-4xl font-headline font-bold text-primary">Proxy Personnalisé PANDA</h1>
      <p className="text-xl text-muted-foreground max-w-2xl">
        Cette section est en cours de développement. Elle vous permettra de configurer un proxy vers un site ou une IP existante, et d'obtenir une URL PANDA personnalisée pour y accéder.
      </p>
      <Card className="w-full max-w-md mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Bientôt Disponible</CardTitle>
          <CardDescription>Masquez ou simplifiez l'accès à des ressources externes via une URL PANDA.</CardDescription>
        </CardHeader>
        <CardContent>
          <LinkIcon className="h-16 w-16 text-accent mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            Entrez une URL cible, choisissez votre sous-domaine PANDA, et nous nous occupons du reste.
          </p>
        </CardContent>
      </Card>

       <Alert className="w-full max-w-md mt-4">
        <Gauge className="h-5 w-5" />
        <AlertTitle>Vos Quotas de Proxys Personnalisés</AlertTitle>
        <AlertDescription>
          Votre grade actuel vous permet de configurer jusqu'à : {" "}
          {userQuotaConfig.maxCustomProxies === Infinity ? (
            <span className="inline-flex items-center gap-1 font-semibold text-primary"><InfinityIcon className="h-4 w-4 text-green-600" /></span>
          ) : (
            <strong className="text-primary">{userQuotaConfig.maxCustomProxies}</strong>
          )}
          {" "} proxy(s) personnalisé(s).
        </AlertDescription>
      </Alert>

       <Button asChild variant="outline" className="mt-8">
         <Link href="/dashboard">Retour à l'Aperçu</Link>
       </Button>
    </div>
  );
}
