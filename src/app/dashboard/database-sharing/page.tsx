
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DatabaseZap, Construction, Share2, UploadCloud } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function DatabaseSharingPage() {
  return (
    <div className="space-y-8 flex flex-col items-center justify-center text-center min-h-[calc(100vh-300px)]">
       <Construction className="h-24 w-24 text-primary mb-6" />
      <h1 className="text-4xl font-headline font-bold text-primary">Hébergement & Partage de Bases de Données</h1>
      <p className="text-xl text-muted-foreground max-w-2xl">
        Cette section est en cours de développement. Elle vous permettra d'héberger vos fichiers de base de données (ex: .db, .sqlite) et de les partager de manière sécurisée via un lien.
      </p>
      <Card className="w-full max-w-lg mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Bientôt Disponible</CardTitle>
          <CardDescription>Hébergez et partagez vos fichiers de base de données facilement.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center items-center gap-4">
            <UploadCloud className="h-16 w-16 text-accent" />
            <DatabaseZap className="h-16 w-16 text-accent" />
            <Share2 className="h-16 w-16 text-accent" />
          </div>
          <Alert>
            <AlertTitle>Fonctionnalités Prévues</AlertTitle>
            <AlertDescription>
              Vous pourrez uploader vos fichiers de base de données (SQLite, etc.), obtenir un lien de téléchargement direct (potentiellement sécurisé par un token d'accès), et gérer les versions ou les accès.
              Idéal pour partager des bases de données pour des démos, des tests, ou des petites applications.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
       <Button asChild variant="outline" className="mt-8">
         <Link href="/dashboard">Retour au Tableau de Bord</Link>
       </Button>
       <p className="text-xs text-muted-foreground mt-10 italic">
        <span className="text-primary">P</span>ortable <span className="text-primary">A</span>nd <span className="text-primary">N</span>etworked <span className="text-primary">D</span>atabase <span className="text-primary">A</span>rchives
      </p>
    </div>
  );
}
    
