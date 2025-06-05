
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DatabaseZap, Construction, Share2 } from "lucide-react";

export default function DatabaseSharingPage() {
  return (
    <div className="space-y-8 flex flex-col items-center justify-center text-center min-h-[calc(100vh-300px)]">
       <Construction className="h-24 w-24 text-primary mb-6" />
      <h1 className="text-4xl font-headline font-bold text-primary">Partage de Bases de Données</h1>
      <p className="text-xl text-muted-foreground max-w-2xl">
        Cette section est en cours de développement. Elle vous permettra de partager des fichiers de base de données (.db, etc.) de manière sécurisée via un lien.
      </p>
      <Card className="w-full max-w-md mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Bientôt Disponible</CardTitle>
          <CardDescription>Partagez facilement vos bases de données SQLite ou autres fichiers similaires.</CardDescription>
        </CardHeader>
        <CardContent>
          <DatabaseZap className="h-16 w-16 text-accent mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            Nous préparons un système où vous pourrez uploader un fichier .db, obtenir un lien public (avec potentiellement un token d'accès privé), et le partager.
          </p>
        </CardContent>
      </Card>
       <Button asChild variant="outline" className="mt-8">
         <Link href="/dashboard">Retour à l'Aperçu</Link>
       </Button>
    </div>
  );
}
