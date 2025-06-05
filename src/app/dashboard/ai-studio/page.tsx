
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sparkles, Construction, BrainCircuit, Wand2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AiStudioPage() {
  return (
    <div className="space-y-8 flex flex-col items-center justify-center text-center min-h-[calc(100vh-300px)]">
       <Construction className="h-24 w-24 text-primary mb-6" />
      <h1 className="text-4xl font-headline font-bold text-primary">PANDA AI Studio</h1>
      <p className="text-xl text-muted-foreground max-w-2xl">
        Cette section est en cours de développement. Accédez à des outils et API d'Intelligence Artificielle, avec gestion de quotas.
      </p>
      <Card className="w-full max-w-lg mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Bientôt Disponible</CardTitle>
          <CardDescription>Utilisez des modèles d'IA pour la génération de texte, d'images, et plus encore.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <BrainCircuit className="h-16 w-16 text-accent mx-auto mb-4" />
           <Alert variant="default">
            <Wand2 className="h-5 w-5" />
            <AlertTitle>Fonctionnalités Prévues</AlertTitle>
            <AlertDescription>
                Vous pourrez utiliser une API PANDA AI pour intégrer des fonctionnalités d'IA dans vos propres applications.
                Un système de quotas sera mis en place, potentiellement lié à votre grade utilisateur, pour gérer l'utilisation de l'API.
                L'API PANDA AI agira comme un intermédiaire, transférant les requêtes à des modèles d'IA sous-jacents après vérification des quotas.
            </AlertDescription>
          </Alert>
          <p className="text-sm text-muted-foreground">
            Nous explorons l'intégration de Genkit pour offrir une expérience IA flexible.
          </p>
        </CardContent>
      </Card>
       <Button asChild variant="outline" className="mt-8">
         <Link href="/dashboard">Retour à l'Aperçu</Link>
       </Button>
    </div>
  );
}
