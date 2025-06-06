
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Globe, Construction, Route, ShieldCheck, Settings2, ListChecks, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function DnsManagementPage() {
  return (
    <div className="space-y-8 flex flex-col items-center justify-center text-center min-h-[calc(100vh-300px)]">
       <Construction className="h-24 w-24 text-primary mb-6" />
      <h1 className="text-4xl font-headline font-bold text-primary">Gestion DNS PANDA Avancée</h1>
      <p className="text-xl text-muted-foreground max-w-2xl">
        Cette section est en cours de développement. Elle permettra aux utilisateurs avec un grade <strong className="text-blue-500">PREMIUM</strong> de gérer des enregistrements DNS sous <code className="bg-muted px-1 rounded">*.pandadns.nationquest.fr</code>. Les utilisateurs avec un grade <strong className="text-yellow-500">ENDIUM</strong> pourront en plus enregistrer et gérer entièrement leurs propres noms de domaine (ex: .fr, .com).
      </p>
      <Card className="w-full max-w-2xl mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center justify-center gap-2">
            <Route className="h-7 w-7 text-accent" /> Bientôt Disponible
          </CardTitle>
          <CardDescription>Configurez vos enregistrements DNS, gérez vos zones, et bien plus.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-left">
          <Alert>
            <ShieldCheck className="h-5 w-5" />
            <AlertTitle className="font-semibold">Fonctionnalités par Grade</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>PREMIUM :</strong> Gestion d'enregistrements DNS pour vos services sous <code className="bg-muted/50 px-0.5 rounded">votresousdomaine.pandadns.nationquest.fr</code>.</li>
                <li><strong>ENDIUM :</strong> Toutes les fonctionnalités PREMIUM, plus l'enregistrement, le transfert, et la gestion complète de vos propres noms de domaine (incluant les options ci-dessous).</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="p-4 border rounded-md">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><ListChecks /> Fonctionnalités Prévues (principalement pour ENDIUM avec domaines propres) :</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Liaison de vos propres noms de domaine et gestion complète de leur zone DNS (A, AAAA, CNAME, MX, TXT, SRV, etc.).</li>
              <li>Option DNS Anycast.</li>
              <li>Hébergement Web et e-mail de base (ex: 100Mo) potentiellement inclus avec votre domaine.</li>
              <li>Gestion des sous-domaines et multisites.</li>
              <li>Protection contre le transfert de domaine.</li>
              <li>Délégation Sécurisée avec DNSSEC.</li>
              <li>Configuration de l'affichage des informations WHOIS.</li>
              <li>Adresses e-mail anti-spam associées à vos domaines.</li>
              <li>Gestion des serveurs DNS pour vos domaines.</li>
              <li>Redirections web (301, 302, masquées).</li>
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
              Vous pourrez fournir les informations requises telles que l'IP cible, le type d'enregistrement, la valeur souhaitée, et une preuve de certificat SSL si applicable.
            </AlertDescription>
          </Alert>

        </CardContent>
      </Card>
       <Button asChild variant="outline" className="mt-8">
         <Link href="/dashboard">Retour au Tableau de Bord</Link>
       </Button>
       <p className="text-xs text-muted-foreground mt-10 italic">
        <span className="text-primary">P</span>rogrammable <span className="text-primary">A</span>nd <span className="text-primary">N</span>etworked <span className="text-primary">D</span>omain <span className="text-primary">A</span>dministration
      </p>
    </div>
  );
}
    

    