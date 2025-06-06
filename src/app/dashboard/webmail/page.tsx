
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Mail, Construction, Inbox, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function WebmailPage() {
  return (
    <div className="space-y-8 flex flex-col items-center justify-center text-center min-h-[calc(100vh-300px)]">
       <Construction className="h-24 w-24 text-primary mb-6" />
      <h1 className="text-4xl font-headline font-bold text-primary">Webmail PANDA</h1>
      <p className="text-xl text-muted-foreground max-w-2xl">
        Cette section est en cours de développement. Accédez à une interface webmail pour gérer vos emails PANDA, potentiellement associés à vos domaines personnalisés (Grade <strong className="text-yellow-500">ENDIUM</strong> requis).
      </p>
      <Card className="w-full max-w-md mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Bientôt Disponible</CardTitle>
          <CardDescription>Consultez et envoyez des emails directement depuis PANDA.</CardDescription>
        </CardHeader>
        <CardContent>
          <Inbox className="h-16 w-16 text-accent mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            Une solution de messagerie web intégrée est en préparation.
          </p>
            <Alert className="mt-4">
                <ShieldCheck className="h-5 w-5" />
                <AlertTitle className="font-semibold">Grade ENDIUM Requis</AlertTitle>
                <AlertDescription>
                L'utilisation complète du webmail avec des adresses email personnalisées sera typiquement liée à la gestion de vos propres domaines, une fonctionnalité du grade <strong className="text-yellow-600 font-semibold">ENDIUM</strong>.
                </AlertDescription>
            </Alert>
        </CardContent>
      </Card>
       <Button asChild variant="outline" className="mt-8">
         <Link href="/dashboard">Retour au Tableau de Bord</Link>
       </Button>
       <p className="text-xs text-muted-foreground mt-10 italic">
        <span className="text-primary">P</span>ersonal <span className="text-primary">A</span>ccess <span className="text-primary">N</span>etworked <span className="text-primary">D</span>igital <span className="text-primary">A</span>ddressing
      </p>
    </div>
  );
}
    
