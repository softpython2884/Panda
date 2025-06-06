
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CloudCog, Construction, Share2, Server, Infinity as InfinityIcon, MessageSquare, Link as LinkIconJs, PlusCircle, Loader2, AlertTriangle, PackageSearch, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { RolesConfig, UserRoleDisplayConfig, CloudSpaceCreateSchema, type CloudSpaceCreateInput, type CloudSpace } from "@/lib/schemas";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
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
        toast({ title: "Demande d'Espace Cloud Envoyée", description: `L'espace cloud "${values.name}" est en cours de création. Le bot Discord va prendre le relais.` });
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
          <p className="text-muted-foreground">Gérez vos serveurs cloud personnels et vos fichiers, avec un stockage illimité par serveur et intégration Discord.</p>
        </div>
      </div>
      
      <Alert variant="default" className="shadow-sm">
        <Server className="h-5 w-5" />
        <AlertTitle className="font-semibold">Vos Quotas d'Espaces Cloud</AlertTitle>
        <AlertDescription>
            <span className="block">
              Votre grade ({UserRoleDisplayConfig[userRole].label}) vous donne droit à :&nbsp;
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
            <span className="block mt-1">Chaque espace cloud dispose d'un stockage illimité (conceptuel).</span>
            {!canCreateMore && userQuotaConfig.maxCloudServers !== Infinity && (
              <span className="block text-destructive font-medium mt-1">Vous avez atteint votre limite.</span>
            )}
        </AlertDescription>
      </Alert>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Créer un Nouvel Espace Cloud</CardTitle>
          <CardDescription>Donnez un nom à votre nouvel espace cloud personnel. Cela déclenchera le processus d'intégration Discord.</CardDescription>
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
                      <Input placeholder="Ex: MonProjetSuperSecret" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={!canCreateMore || isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Créer l'Espace Cloud & Initier Discord
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
          <CardDescription>Liste de vos espaces cloud existants et leur état d'intégration Discord.</CardDescription>
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
                  <CardContent className="text-xs space-y-1">
                    <p>ID: <code className="bg-muted px-1 rounded">{space.id}</code></p>
                    {space.discordChannelId ? (
                        <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Salon Discord: <code className="bg-muted px-1 rounded text-green-700">#{space.discordChannelId} (ID)</code></span>
                        </div>
                    ) : (
                      <p className="text-amber-600">Intégration Discord en attente...</p>
                    )}
                    {space.discordWebhookUrl ? (
                      <p className="text-muted-foreground break-all">Webhook privé Discord (pour PANDA): <code className="bg-muted px-1 rounded">{space.discordWebhookUrl.substring(0,35)}...</code></p>
                    ) : (
                      <p className="text-muted-foreground italic">Webhook privé Discord non encore configuré par le bot.</p>
                    )}
                     <p className="text-muted-foreground mt-1">URL d'accès (Concept): <code className="bg-muted px-1 rounded">https://cloud.panda.nationquest.fr/?webhook=URL_WEBHOOK_PRIVÉ_DU_BOT</code></p>
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
          <CardTitle className="font-headline">Concept d&apos;Intégration Cloud <span className="text-primary">P.A.N.D.A.</span> & Bot Discord</CardTitle>
          <CardDescription>Flux de fonctionnement détaillé de l&apos;interaction entre PANDA et votre bot Discord.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-left">
          <div className="flex justify-center items-center gap-4">
            <CloudCog className="h-12 w-12 text-accent" />
            <MessageSquare className="h-12 w-12 text-blue-500" />
            <LinkIconJs className="h-12 w-12 text-green-500" />
          </div>
          <Alert>
            <AlertTitle className="font-semibold">Flux d&apos;Intégration :</AlertTitle>
            <AlertDescription>
                <ol className="list-decimal pl-5 space-y-2 mt-2">
                    <li><strong>Initiation par l&apos;Utilisateur <span className="text-primary">P.A.N.D.A.</span> :</strong> Vous créez un &quot;Espace Cloud&quot; via cette interface PANDA en fournissant un nom.</li>
                    <li><strong><span className="text-primary">P.A.N.D.A.</span> Notifie le Webhook Général Discord :</strong> L&apos;application <span className="text-primary">P.A.N.D.A.</span> envoie un message formaté (contenant le nom de l&apos;espace, votre nom d&apos;utilisateur <span className="text-primary">P.A.N.D.A.</span>, l&apos;ID utilisateur <span className="text-primary">P.A.N.D.A.</span>, et un ID unique pour l&apos;espace cloud) au webhook général Discord que vous avez configuré dans PANDA (ex: <code className="bg-muted px-1 rounded text-xs">https://discord.com/api/webhooks/1380580290212397147/...</code> via la variable d&apos;environnement <code className="bg-muted px-1 rounded text-xs">DISCORD_GENERAL_WEBHOOK_URL</code>).</li>
                    <li><strong>Action du Bot Discord <span className="text-primary">P.A.N.D.A.</span> :</strong> Votre bot Discord (hébergé séparément, par exemple dans un dossier <code className="bg-muted px-1 rounded text-xs">discordbot</code> sur vos serveurs, utilisant son token <code className="bg-muted px-1 rounded text-xs">MTM4M...</code> et l&apos;ID du serveur Discord <code className="bg-muted px-1 rounded text-xs">1380...</code>) écoute les messages arrivant sur ce webhook général.
                        <ul className="list-disc pl-5 space-y-1 mt-1">
                           <li>Quand il détecte le message de PANDA, il crée un nouveau salon textuel privé sur votre serveur Discord (ex: <code className="bg-muted px-1 rounded text-xs">#cloud-votreNomPanda-idCourt</code>).</li>
                           <li>Il génère un webhook Discord unique pour ce nouveau salon privé.</li>
                           <li>**Crucial :** Le bot appelle ensuite une API <span className="text-primary">P.A.N.D.A.</span> sécurisée (<code className="bg-muted px-1 rounded text-xs">PUT /api/pod/cloud/[ID_ESPACE_CLOUD_PANDA]/discord-integration</code>) pour transmettre à <span className="text-primary">P.A.N.D.A.</span> l&apos;URL de ce webhook privé et l&apos;ID du salon privé.</li>
                           <li>Le bot peut vous notifier dans le salon général (ex: <code className="bg-muted px-1 rounded text-xs">@VotreNomDiscord, votre espace cloud &quot;{'{nom_espace}'}&quot; est prêt! Salon: #..., Webhook privé (pour PANDA): https://...</code>) ou poster un message de bienvenue dans le salon privé.</li>
                        </ul>
                    </li>
                    <li><strong><span className="text-primary">P.A.N.D.A.</span> Stocke les Informations :</strong> <span className="text-primary">P.A.N.D.A.</span> enregistre l&apos;URL du webhook privé et l&apos;ID du salon privé dans sa base de données, associés à votre espace cloud.</li>
                    <li><strong>Interaction via URL <span className="text-primary">P.A.N.D.A.</span> (Concept) :</strong> Votre espace cloud <span className="text-primary">P.A.N.D.A.</span> devient alors conceptuellement accessible ou interactive via une URL publique unique, par exemple : <code className="bg-muted px-1 rounded text-xs">https://cloud.panda.nationquest.fr/?webhook=URL_DU_WEBHOOK_PRIVÉ_STOCKÉE_PAR_PANDA</code>. Lorsque vous (ou un service PANDA) envoyez des données (fichiers, commandes, etc.) à cette URL <span className="text-primary">P.A.N.D.A.</span>, PANDA utilisera le webhook privé stocké pour transmettre ces données à votre salon Discord dédié.</li>
                </ol>
                <p className="mt-2 text-xs text-muted-foreground">Les identifiants de votre bot Discord (token, ID du salon général d&apos;écoute, ID du rôle admin pour les permissions) sont gérés par votre bot dans son propre environnement (ex: fichier <code className="bg-muted px-1 rounded text-xs">.env</code> du bot, potentiellement un <code className="bg-muted px-1 rounded text-xs">.env.cloud</code>). PANDA utilise uniquement le webhook général que vous lui avez fourni dans ses variables d&apos;environnement.</p>
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
    


