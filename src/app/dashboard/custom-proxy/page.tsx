
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Network, Construction, Link2 } from "lucide-react";

export default function CustomProxyPage() {
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
          <Link2 className="h-16 w-16 text-accent mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            Entrez une URL cible, choisissez votre sous-domaine PANDA, et nous nous occupons du reste.
          </p>
        </CardContent>
      </Card>
       <Button asChild variant="outline" className="mt-8">
         <Link href="/dashboard">Retour à l'Aperçu</Link>
       </Button>
    </div>
  );
}
