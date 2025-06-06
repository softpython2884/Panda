
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sparkles, Construction, BrainCircuit, Wand2, ShieldCheck, Gauge, Infinity as InfinityIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { RolesConfig, UserRoleDisplayConfig } from "@/lib/schemas";


export default function AiStudioPage() {
  const { user } = useAuth();
  const userRole = user?.role || 'FREE';
  const userQuotaConfig = RolesConfig[userRole];


  return (
    <div className="space-y-8 flex flex-col items-center justify-center text-center min-h-[calc(100vh-300px)]">
       <Construction className="h-24 w-24 text-primary mb-6" />
      <h1 className="text-4xl font-headline font-bold text-primary">PANDA AI Studio</h1>
      <p className="text-xl text-muted-foreground max-w-2xl">
        Cette section est en cours de développement. Accédez à une API PANDA AI pour intégrer des capacités d'IA dans vos applications.
      </p>
      <Card className="w-full max-w-lg mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Bientôt Disponible: API PANDA AI</CardTitle>
          <CardDescription>Utilisez des modèles d'IA personnalisables pour des usages personnels ou professionnels, hébergés sur nos serveurs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <BrainCircuit className="h-16 w-16 text-accent mx-auto mb-4" />
           <Alert variant="default">
            <Wand2 className="h-5 w-5" />
            <AlertTitle>Capacités de l'API PANDA AI</AlertTitle>
            <AlertDescription>
                L'API PANDA AI vous permettra d'accéder à divers modèles d'intelligence artificielle (texte, image, etc.).
                Les modèles pourront être personnalisés pour des besoins spécifiques.
                Un système de quotas, potentiellement lié à votre grade utilisateur, gérera l'utilisation de l'API.
            </AlertDescription>
          </Alert>
           <Alert variant="default" className="mt-4">
            <ShieldCheck className="h-5 w-5" />
            <AlertTitle>Confidentialité des Données</AlertTitle>
            <AlertDescription>
                Toutes les interactions avec l'API PANDA AI sont traitées sur nos serveurs.
                Conformément à notre engagement de confidentialité pour tous nos services PANDA, aucune de vos données ou conversations n'est sauvegardée par nous après le traitement de votre requête.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Alert className="w-full max-w-lg mt-4">
        <Gauge className="h-5 w-5" />
        <AlertTitle>Vos Quotas d'Appels API AI</AlertTitle>
        <AlertDescription>
            <span className="block">
              Votre grade ({UserRoleDisplayConfig[userRole].label}) vous donne droit à :&nbsp;
              {userQuotaConfig.maxApiAICallsPerDay === Infinity ? (
                  <span className="inline-flex items-center gap-1">
                      <InfinityIcon className="h-4 w-4 text-green-600" /> 
                      <span>appels API AI illimités / jour.</span>
                  </span>
              ) : (
                  <span>
                      <strong className="text-primary">{userQuotaConfig.maxApiAICallsPerDay}</strong> appels API AI / jour.
                  </span>
              )}
            </span>
           <span className="block mt-1">(Quota non encore actif)</span>
        </AlertDescription>
      </Alert>


       <Button asChild variant="outline" className="mt-8">
         <Link href="/dashboard">Retour au Tableau de Bord</Link>
       </Button>
       <p className="text-center text-xs text-muted-foreground mt-10 italic">
        <span className="text-primary">P</span>ersonalized <span className="text-primary">A</span>rtificial <span className="text-primary">N</span>etworked <span className="text-primary">D</span>evelopment <span className="text-primary">A</span>rena
      </p>
    </div>
  );
}
    

    

