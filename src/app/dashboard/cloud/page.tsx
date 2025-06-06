
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CloudCog, Construction, Share2, Server, Infinity as InfinityIcon, MessageSquare, Link as LinkIcon } from "lucide-react"; // Added MessageSquare, LinkIcon
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { RolesConfig, UserRoleDisplayConfig } from "@/lib/schemas";

export default function CloudDashboardPage() {
  const { user } = useAuth();
  const userRole = user?.role || 'FREE';
  const userQuotaConfig = RolesConfig[userRole];

  return (
    <div className="space-y-8 flex flex-col items-center justify-center text-center min-h-[calc(100vh-300px)]">
       <Construction className="h-24 w-24 text-primary mb-6" />
      <h1 className="text-4xl font-headline font-bold text-primary">Espace Cloud PANDA</h1>
      <p className="text-xl text-muted-foreground max-w-2xl">
        Cette section est en cours de développement. Hébergez vos propres serveurs cloud personnels et partagez des fichiers, avec une intégration poussée.
      </p>
      <Card className="w-full max-w-lg mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Bientôt Disponible: Espace Cloud Intégré</CardTitle>
          <CardDescription>Gérez vos serveurs cloud personnels et vos fichiers, avec un stockage illimité par serveur.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-left">
          <div className="flex justify-center items-center gap-4">
            <CloudCog className="h-12 w-12 text-accent" />
            <MessageSquare className="h-12 w-12 text-blue-500" /> {/* Discord-like icon */}
            <LinkIcon className="h-12 w-12 text-green-500" /> {/* Webhook-like icon */}
          </div>
          <Alert>
            <AlertTitle className="font-semibold">Fonctionnalités Prévues (Concept) :</AlertTitle>
            <AlertDescription>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li><strong>Intégration Bot Discord :</strong> À la création d'un "espace cloud", un bot Discord (connecté à un serveur PANDA dédié) pourrait créer un salon privé pour l'utilisateur.</li>
                    <li><strong>Webhook Personnalisé :</strong> Dans ce salon Discord, un webhook unique serait généré au nom de l'utilisateur.</li>
                    <li><strong>URL d'Accès :</strong> Votre espace cloud serait accessible via une URL publique unique, par exemple : <code className="bg-muted px-1 rounded text-xs">https://cloud.panda.nationquest.fr/?webhook=VOTRE_URL_WEBHOOK_DISCORD</code>. Cette URL pourrait être utilisée par des applications pour envoyer des notifications ou des données à votre espace cloud via le webhook Discord.</li>
                    <li><strong>Partage Sécurisé :</strong> Le partage d'un cloud avec un autre utilisateur pourrait générer un second webhook (avec des permissions distinctes) dans le même salon Discord, permettant de tracer les accès et de contrôler les permissions.</li>
                    <li><strong>Traçabilité :</strong> Le créateur de l'espace cloud pourrait visualiser les accès récents ou les événements (comme des fichiers uploadés via une intégration) via les messages du webhook dans son salon Discord.</li>
                </ul>
                <p className="mt-2 text-xs text-muted-foreground">Les identifiants du bot Discord (Token, ID Serveur) seraient idéalement stockés dans un fichier <code className="bg-muted px-1 rounded">.env.cloud</code> côté serveur PANDA pour la gestion.</p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Alert className="w-full max-w-lg mt-4">
        <Server className="h-5 w-5" />
        <AlertTitle>Vos Quotas de Serveurs Cloud</AlertTitle>
        <AlertDescription className="inline-flex items-center gap-1">
          Votre grade actuel ({UserRoleDisplayConfig[userRole].label}) vous permet de créer jusqu'à :&nbsp;
          {userQuotaConfig.maxCloudServers === Infinity ? (
            <span className="inline-flex items-center gap-1 font-semibold text-green-600"><InfinityIcon className="h-4 w-4" /></span>
          ) : (
            <strong className="text-primary">{userQuotaConfig.maxCloudServers} serveur(s) cloud</strong>
          )}
          . Chaque serveur cloud dispose d'un espace de stockage illimité.
        </AlertDescription>
      </Alert>

      <Alert className="w-full max-w-lg mt-4">
        <Share2 className="h-5 w-5" />
        <AlertTitle>Partage de Serveurs Cloud (Prochainement)</AlertTitle>
        <AlertDescription>
          Vous pourrez bientôt partager l'accès à vos serveurs cloud ou fichiers spécifiques avec d'autres utilisateurs PANDA ou via des liens publics sécurisés.
          La gestion des permissions et des liens de partage sera disponible ici.
        </AlertDescription>
      </Alert>

       <Button asChild variant="outline" className="mt-8">
         <Link href="/dashboard">Retour au Tableau de Bord</Link>
       </Button>
        <p className="text-xs text-muted-foreground mt-10 italic">PANDA: Personal Archive & Networked Data Access</p>
    </div>
  );
}
    