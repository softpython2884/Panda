
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CloudCog, Construction } from "lucide-react";

export default function CloudDashboardPage() {
  return (
    <div className="space-y-8 flex flex-col items-center justify-center text-center min-h-[calc(100vh-300px)]">
       <Construction className="h-24 w-24 text-primary mb-6" />
      <h1 className="text-4xl font-headline font-bold text-primary">Espace Cloud PANDA</h1>
      <p className="text-xl text-muted-foreground max-w-2xl">
        Cette section est en cours de développement.
      </p>
      <Card className="w-full max-w-md mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Bientôt Disponible</CardTitle>
          <CardDescription>Revenez bientôt pour gérer vos fichiers et partages cloud directement depuis PANDA !</CardDescription>
        </CardHeader>
        <CardContent>
          <CloudCog className="h-16 w-16 text-accent mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            Nous travaillons activement à l'intégration de fonctionnalités de stockage cloud sécurisé et facile à utiliser.
          </p>
        </CardContent>
      </Card>
       <Button asChild variant="outline" className="mt-8">
         <Link href="/dashboard">Retour à l'Aperçu</Link>
       </Button>
    </div>
  );
}
