
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CloudCog, Construction, Share2, Server, Infinity as InfinityIcon, MessageSquare, Link as LinkIcon, PlusCircle, Loader2, AlertTriangle, PackageSearch } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { RolesConfig, UserRoleDisplayConfig, CloudSpaceCreateSchema, type CloudSpaceCreateInput, type CloudSpace } from "@/lib/schemas";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";


export default function CloudDashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cloudSpaces, setCloudSpaces] = useState<CloudSpace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userRole = user?.role || 'FREE';
  const userQuotaConfig = user ? RolesConfig[userRole] : RolesConfig.FREE;
  const canCreateMore = user ? userQuotaConfig.maxCloudServers === Infinity || cloudSpaces.length < userQuotaConfig.maxCloudServers : false;

  const form = useForm<CloudSpaceCreateInput>({
    resolver: zodResolver(CloudSpaceCreateSchema),
    defaultValues: {
      name: "",
    },
  });

  async function fetchCloudSpaces() {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/dashboard/cloud');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch cloud spaces');
      }
      const data = await response.json();
      setCloudSpaces(data.cloudSpaces || []);
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Erreur de chargement", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      fetchCloudSpaces();
    } else {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);


  async function onSubmitCreateSpace(values: CloudSpaceCreateInput) {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/dashboard/cloud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (response.ok) {
        toast({ title: "Espace Cloud Créé", description: `L'espace cloud "${values.name}" a été créé.` });
        form.reset();
        fetchCloudSpaces(); // Refresh list
      } else {
        throw new Error(data.error || "Failed to create cloud space");
      }
    } catch (error: any) {
      toast({ title: "Erreur de Création", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Espace Cloud PANDA</h1>
          <p className="text-muted-foreground">Gérez vos serveurs cloud personnels et vos fichiers, avec un stockage illimité par serveur.</p>
        </div>
      </div>
      
      <Alert variant="default" className="shadow-sm">
        <Server className="h-5 w-5" />
        <AlertTitle className="font-semibold">Vos Quotas d'Espaces Cloud</AlertTitle>
        <AlertDescription>
            <span className="block">Votre grade ({UserRoleDisplayConfig[userRole].label}) vous donne droit à :&nbsp;
            {userQuotaConfig.maxCloudServers === Infinity ? (
                 <span className="inline-flex items-center gap-1">
                    <InfinityIcon className="h-4 w-4 text-green-600" /> 
                    <span>espaces cloud illimités.</span>
                </span>
            ) : (
                <span>
                    <strong className="text-primary">{cloudSpaces.length}</strong> sur <strong className="text-primary">{userQuotaConfig.maxCloudServers}</strong> espace(s) cloud utilisé(s).
                </span>
            )}
            </span>
            <span className="block mt-1">Chaque espace cloud dispose d'un stockage illimité.</span>
            {!canCreateMore && userQuotaConfig.maxCloudServers !== Infinity && (
              <span className="text-destructive font-medium ml-1">Vous avez atteint votre limite.</span>
            )}
        </AlertDescription>
      </Alert>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Créer un Nouvel Espace Cloud</CardTitle>
          <CardDescription>Donnez un nom à votre nouvel espace cloud personnel.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitCreateSpace)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de l'Espace Cloud</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Mes Projets Perso" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={!canCreateMore || isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Créer l'Espace Cloud
              </Button>
              {!canCreateMore && userQuotaConfig.maxCloudServers !== Infinity && (
                <p className="text-sm text-destructive mt-2">Vous avez atteint votre quota d'espaces cloud.</p>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Mes Espaces Cloud</CardTitle>
          <CardDescription>Liste de vos espaces cloud existants.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Chargement de vos espaces cloud...</p>
            </div>
          )}
          {!isLoading && error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle>Erreur de chargement</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {!isLoading && !error && cloudSpaces.length === 0 && (
             <div className="text-center py-10 flex flex-col items-center">
                <PackageSearch className="h-24 w-24 text-muted-foreground mb-6" />
                <p className="text-xl text-muted-foreground">Vous n'avez pas encore d'espace cloud.</p>
            </div>
          )}
          {!isLoading && !error && cloudSpaces.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cloudSpaces.map((space) => (
                <Card key={space.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Server className="h-5 w-5 text-primary"/>{space.name}</CardTitle>
                    <CardDescription>Créé le: {new Date(space.createdAt).toLocaleDateString()}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {space.discordWebhookUrl ? (
                      <p className="text-xs text-muted-foreground break-all">Webhook: <code className="bg-muted px-1 rounded">{space.discordWebhookUrl}</code></p>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Webhook Discord non configuré (concept).</p>
                    )}
                     <p className="text-xs text-muted-foreground mt-1">URL d'accès (Concept): <code className="bg-muted px-1 rounded">https://cloud.panda.nationquest.fr/?webhook=URL_WEBHOOK_ASSOCIE</code></p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm" disabled>Gérer (Bientôt)</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="w-full mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Concept d'Intégration Cloud & Discord</CardTitle>
          <CardDescription>Fonctionnement prévu pour l'interaction avec Discord.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-left">
          <div className="flex justify-center items-center gap-4">
            <CloudCog className="h-12 w-12 text-accent" />
            <MessageSquare className="h-12 w-12 text-blue-500" />
            <LinkIcon className="h-12 w-12 text-green-500" />
          </div>
          <Alert>
            <AlertTitle className="font-semibold">Fonctionnalités Prévues (Concept) :</AlertTitle>
            <AlertDescription>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li><strong>Initiation via Salon Général :</strong> Un utilisateur PANDA initie la création d'un espace cloud. PANDA envoie un message formaté (avec nom de l'espace, utilisateur PANDA, ID unique de l'espace) à un salon Discord général PANDA via un webhook PANDA principal (ex: <code className="bg-muted px-1 rounded text-xs">https://discord.com/api/webhooks/1380580290212397147/...</code>).</li>
                    <li><strong>Action du Bot Discord PANDA :</strong> Un bot Discord PANDA (conceptuellement hébergé dans un dossier <code className="bg-muted px-1 rounded text-xs">discordbot</code> sur nos serveurs PANDA) écoute ce salon général. Lorsqu'il détecte le message formaté de PANDA :
                        <ul className="list-disc pl-5 space-y-1 mt-1">
                           <li>Il crée un nouveau salon privé sur le serveur Discord PANDA dédié à l'utilisateur (ex: <code className="bg-muted px-1 rounded text-xs">#cloud-username-espaceid</code>).</li>
                           <li>Il génère un webhook Discord unique pour ce nouveau salon privé.</li>
                           <li>Le bot PANDA stocke ensuite cette nouvelle URL de webhook dans la base de données PANDA, associée à l'espace cloud de l'utilisateur (via une API interne PANDA).</li>
                           <li>Le bot répond dans le salon général PANDA avec le lien du webhook du salon privé (ex: <code className="bg-muted px-1 rounded text-xs">@UsernameDiscord, votre webhook pour l'espace "{'{nom_espace}'}" est : https://discord.com/api/webhooks/...</code>).</li>
                        </ul>
                    </li>
                    <li><strong>URL d'Accès & Interaction :</strong> L'espace cloud devient adressable via une URL publique unique fournie par PANDA, par exemple : <code className="bg-muted px-1 rounded text-xs">https://cloud.panda.nationquest.fr/?webhook=URL_DU_WEBHOOK_PRIVÉ_CRÉÉ_PAR_LE_BOT</code>. Envoyer des données (ex: fichiers, commandes) à cette URL PANDA les transmettrait au salon Discord privé de l'utilisateur via son webhook dédié.</li>
                    <li><strong>Partage Sécurisé & Traçabilité :</strong> Le partage d'un espace cloud avec un autre utilisateur PANDA pourrait soit l'inviter au salon Discord privé, soit (plus avancé) générer un second webhook avec des permissions distinctes dans ce même salon, permettant de tracer les accès et les actions par utilisateur.</li>
                </ul>
                <p className="mt-2 text-xs text-muted-foreground">Les identifiants du bot Discord (Token du bot: <code className="bg-muted px-1 rounded text-xs">MTM4M...</code>, ID du serveur: <code className="bg-muted px-1 rounded text-xs">1380...</code>) seraient stockés de manière sécurisée dans un fichier <code className="bg-muted px-1 rounded text-xs">.env.cloud</code> sur le serveur PANDA.</p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground mt-10 italic">
        <span className="text-primary">P</span>ersonal <span className="text-primary">A</span>rchive & <span className="text-primary">N</span>etworked <span className="text-primary">D</span>ata <span className="text-primary">A</span>ccess
      </p>
    </div>
  );
}
    
