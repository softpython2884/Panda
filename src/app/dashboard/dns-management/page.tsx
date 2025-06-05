
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Globe, Construction, Route, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function DnsManagementPage() {
  return (
    <div className="space-y-8 flex flex-col items-center justify-center text-center min-h-[calc(100vh-300px)]">
       <Construction className="h-24 w-24 text-primary mb-6" />
      <h1 className="text-4xl font-headline font-bold text-primary">Gestion DNS PANDA</h1>
      <p className="text-xl text-muted-foreground max-w-2xl">
        Cette section est en cours de développement. Elle permettra aux utilisateurs (avec un grade minimum PREMIUM) de demander des enregistrements DNS personnalisés sous `pandadns.nationquest.fr`.
      </p>
      <Card className="w-full max-w-lg mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Bientôt Disponible</CardTitle>
          <CardDescription>Configurez vos propres enregistrements DNS pour pointer vers vos IPs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Route className="h-16 w-16 text-accent mx-auto mb-4" />
          <Alert>
            <ShieldCheck className="h-5 w-5" />
            <AlertTitle className="font-semibold">Fonctionnalité Premium</AlertTitle>
            <AlertDescription>
              La création d'enregistrements DNS nécessitera un grade utilisateur PREMIUM ou supérieur.
              Vous pourrez soumettre une demande en fournissant :
              <ul className="list-disc list-inside text-left text-sm mt-2">
                <li>L'adresse IP (IPv4 ou IPv6) de votre machine/VM.</li>
                <li>Le type d'enregistrement souhaité (A, AAAA, CNAME, TXT, etc.).</li>
                <li>La valeur souhaitée pour votre enregistrement (ex: `monserveur` pour `monserveur.pandadns.nationquest.fr`).</li>
                <li>Une preuve de certificat SSL valide si applicable.</li>
              </ul>
              Les demandes seront soumises à un processus de validation.
            </AlertDescription>
          </Alert>
          <p className="text-sm text-muted-foreground mt-4">
            Intégration avec le système de "Commandes" pour la gestion des demandes DNS par les administrateurs.
          </p>
        </CardContent>
      </Card>
       <Button asChild variant="outline" className="mt-8">
         <Link href="/dashboard">Retour à l'Aperçu</Link>
       </Button>
    </div>
  );
}
