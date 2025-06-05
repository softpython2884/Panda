
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Globe, Construction, Route, ShieldCheck, Settings2, ListChecks, BadgePercent } from "lucide-react"; // Added ListChecks, BadgePercent
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function DnsManagementPage() {
  return (
    <div className="space-y-8 flex flex-col items-center justify-center text-center min-h-[calc(100vh-300px)]">
       <Construction className="h-24 w-24 text-primary mb-6" />
      <h1 className="text-4xl font-headline font-bold text-primary">Gestion DNS PANDA Avancée</h1>
      <p className="text-xl text-muted-foreground max-w-2xl">
        Cette section est en cours de développement. Elle permettra aux utilisateurs (avec un grade <strong className="text-yellow-500">ENDIUM</strong> minimum) de demander et gérer des enregistrements DNS personnalisés sous <code className="bg-muted px-1 rounded">pandadns.nationquest.fr</code> ou leurs propres domaines.
      </p>
      <Card className="w-full max-w-2xl mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center justify-center gap-2">
            <Route className="h-7 w-7 text-accent" /> Bientôt Disponible
          </CardTitle>
          <CardDescription>Configurez vos propres enregistrements DNS pour pointer vers vos IPs, gérez votre zone DNS, et plus encore.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-left">
          <Alert>
            <ShieldCheck className="h-5 w-5" />
            <AlertTitle className="font-semibold">Fonctionnalité pour Grade ENDIUM</AlertTitle>
            <AlertDescription>
              La création et la gestion avancée d'enregistrements DNS nécessiteront un grade utilisateur <strong className="text-yellow-600 font-semibold">ENDIUM</strong> ou supérieur.
            </AlertDescription>
          </Alert>

          <div className="p-4 border rounded-md">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><ListChecks /> Fonctionnalités Prévues :</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Demande d'enregistrements DNS (A, AAAA, CNAME, TXT, MX, etc.) pour <code className="bg-muted/50 px-0.5 rounded">*.pandadns.nationquest.fr</code>.</li>
              <li>Liaison de vos propres noms de domaine et gestion complète de leur zone DNS.</li>
              <li>Option DNS Anycast pour une haute disponibilité et de faibles latences.</li>
              <li>Hébergement Web et e-mail de base (ex: 100Mo) potentiellement inclus avec les domaines gérés par PANDA.</li>
              <li>Gestion des sous-domaines et multisites.</li>
              <li>Protection contre le transfert de domaine.</li>
              <li>Délégation Sécurisée avec DNSSEC.</li>
              <li>Configuration de l'affichage des informations WHOIS.</li>
              <li>Adresses e-mail anti-spam associées à vos domaines.</li>
              <li>Gestion des serveurs DNS pour vos domaines.</li>
              <li>Redirections web.</li>
              <li>DynHOST pour les adresses IP dynamiques.</li>
              <li>Configuration GLUE pour personnaliser vos serveurs DNS.</li>
              <li>Gestion des enregistrements DS pour DNSSEC.</li>
            </ul>
          </div>
          
          <Alert variant="default" className="mt-4">
            <Settings2 className="h-5 w-5" />
            <AlertTitle>Processus de Demande et de Gestion</AlertTitle>
            <AlertDescription>
              Les demandes de configuration DNS (en particulier pour les domaines personnalisés) pourront passer par un système de "Commandes" pour validation par les administrateurs PANDA.
              Vous pourrez fournir les informations requises telles que l'IP cible, le type d'enregistrement, la valeur souhaitée, et une preuve de certificat SSL si applicable (pour les configurations HTTPS).
            </AlertDescription>
          </Alert>

        </CardContent>
      </Card>
       <Button asChild variant="outline" className="mt-8">
         <Link href="/dashboard">Retour à l'Aperçu</Link>
       </Button>
    </div>
  );
}
