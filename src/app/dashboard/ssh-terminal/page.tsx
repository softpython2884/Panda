
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { TerminalSquare, Construction } from "lucide-react";

export default function SshTerminalPage() {
  return (
    <div className="space-y-8 flex flex-col items-center justify-center text-center min-h-[calc(100vh-300px)]">
       <Construction className="h-24 w-24 text-primary mb-6" />
      <h1 className="text-4xl font-headline font-bold text-primary">SSH in Browser</h1>
      <p className="text-xl text-muted-foreground max-w-2xl">
        Cette section est en cours de développement. Elle permettra d'accéder à un terminal SSH directement depuis votre navigateur pour gérer vos serveurs distants.
      </p>
      <Card className="w-full max-w-md mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Bientôt Disponible</CardTitle>
          <CardDescription>Revenez bientôt pour une console SSH web intégrée !</CardDescription>
        </CardHeader>
        <CardContent>
          <TerminalSquare className="h-16 w-16 text-accent mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            Nous travaillons à l'intégration d'un client SSH sécurisé pour un accès direct.
          </p>
        </CardContent>
      </Card>
       <Button asChild variant="outline" className="mt-8">
         <Link href="/dashboard">Retour au Tableau de Bord</Link>
       </Button>
       <p className="text-xs text-muted-foreground mt-10 italic">
        <span className="text-primary">P</span>roxied <span className="text-primary">A</span>ccess, <span className="text-primary">N</span>ear-<span className="text-primary">D</span>irect <span className="text-primary">A</span>dministration
      </p>
    </div>
  );
}
    
