
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Construction, MailPlus } from "lucide-react";

export default function AdminSendNotificationPage() {
  return (
    <div className="space-y-8 flex flex-col items-center justify-center text-center min-h-[calc(100vh-300px)]">
       <Construction className="h-24 w-24 text-destructive mb-6" />
      <h1 className="text-4xl font-headline font-bold text-destructive">Envoyer une Notification</h1>
      <p className="text-xl text-muted-foreground max-w-2xl">
        Cette section est en cours de développement et permettra aux administrateurs d'envoyer des notifications ciblées aux utilisateurs.
      </p>
      <Card className="w-full max-w-md mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-destructive">Bientôt Disponible</CardTitle>
          <CardDescription>Revenez bientôt pour un formulaire permettant d'envoyer des messages aux utilisateurs du système PANDA.</CardDescription>
        </CardHeader>
        <CardContent>
          <MailPlus className="h-16 w-16 text-destructive/70 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            Nous travaillons à l'intégration d'un outil d'envoi de notifications.
          </p>
        </CardContent>
      </Card>
       <Button asChild variant="outline" className="mt-8">
         <Link href="/admin">Retour au Dashboard Admin</Link>
       </Button>
    </div>
  );
}
