
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Puzzle, Construction, Settings2 } from "lucide-react";

export default function IntegrationsPage() {
  return (
    <div className="space-y-8 flex flex-col items-center justify-center text-center min-h-[calc(100vh-300px)]">
       <Construction className="h-24 w-24 text-primary mb-6" />
      <h1 className="text-4xl font-headline font-bold text-primary">Intégrations de Services</h1>
      <p className="text-xl text-muted-foreground max-w-2xl">
        Cette section est en cours de développement. Elle permettra de configurer des intégrations avec des services externes comme RCON, GitHub, etc.
      </p>
      <Card className="w-full max-w-md mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Bientôt Disponible</CardTitle>
          <CardDescription>Connectez PANDA à vos outils et services favoris.</CardDescription>
        </CardHeader>
        <CardContent>
          <Puzzle className="h-16 w-16 text-accent mx-auto mb-4" />
           <p className="text-sm text-muted-foreground">
            Imaginez pouvoir gérer des commandes RCON pour vos serveurs de jeu ou automatiser des actions GitHub directement depuis PANDA.
          </p>
        </CardContent>
      </Card>
       <Button asChild variant="outline" className="mt-8">
         <Link href="/dashboard">Retour au Tableau de Bord</Link>
       </Button>
       <p className="text-xs text-muted-foreground mt-10 italic">
        <span className="text-primary">P</span>rogrammable <span className="text-primary">A</span>utomation & <span className="text-primary">N</span>etworked <span className="text-primary">D</span>evelopment <span className="text-primary">A</span>pplications
      </p>
    </div>
  );
}
    

    