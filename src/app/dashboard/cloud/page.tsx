
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CloudCog, Construction, Share2, Server, Infinity as InfinityIcon, MessageSquare, Link as LinkIconJs, PlusCircle, Loader2, AlertTriangle, PackageSearch, CheckCircle, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { RolesConfig, UserRoleDisplayConfig, CloudSpaceCreateSchema, type CloudSpaceCreateInput, type CloudSpace, PANDA_CLOUD_APP_BASE_URL, DISCORD_GENERAL_WEBHOOK_URL as SCHEMA_DISCORD_GENERAL_WEBHOOK_URL } from "@/lib/schemas";
import { useEffect, useState, useCallback } from "react";
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
import { format } from "date-fns";
import { fr } from "date-fns/locale";


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

  const fetchCloudSpaces = useCallback(async () => {
    if (!user) {
      setIsLoading(false); // Ensure loading stops if no user
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/dashboard/cloud', { cache: 'no-store' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch cloud spaces');
      }
      const data = await response.json();
      setCloudSpaces(data.cloudSpaces || []);
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Erreur de chargement", description: err.message, variant: "destructive" });
      setCloudSpaces([]); // Clear spaces on error
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);


  useEffect(() => {
    fetchCloudSpaces();
  }, [fetchCloudSpaces]);


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
  
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      // Date string from API is now expected to be ISO 8601 UTC
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      return format(date, "dd/MM/yyyy HH:mm", { locale: fr });
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return 'Format de date invalide';
    }
  };


  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Espace Cloud <span className="text-primary">P.A.N.D.A.</span></h1>
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
              {cloudSpaces.map((space) => {
                const isIntegrationComplete = !!space.discordChannelId && !!space.discordWebhookUrl;
                let accessUrl = "";
                if (isIntegrationComplete && space.discordWebhookUrl) {
                  const baseCloudUrl = PANDA_CLOUD_APP_BASE_URL || "https://cloud.panda.nationquest.fr"; // Fallback if env var is somehow undefined client-side
                  accessUrl = `${baseCloudUrl}/?webhook=${encodeURIComponent(space.discordWebhookUrl)}`;
                }

                return (
                  <Card key={space.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Server className="h-5 w-5 text-primary"/>{space.name}</CardTitle>
                      <CardDescription>Créé le: {formatDate(space.createdAt)}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-xs space-y-1">
                      <p>ID: <code className="bg-muted px-1 rounded">{space.id}</code></p>
                      {isIntegrationComplete && space.discordChannelId ? (
                          <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span>Salon Discord: <code className="bg-muted px-1 rounded text-green-700">#{space.discordChannelId.substring(0,10)}... (ID)</code></span>
                          </div>
                      ) : (
                        <p className="text-amber-600">Intégration de l'espace Cloud en attente...</p>
                      )}
                      {isIntegrationComplete && space.discordWebhookUrl ? (
                        <p className="text-muted-foreground break-all">Webhook Discord privé lié.</p>
                      ) : (
                        <p className="text-muted-foreground italic">Espace Cloud pas encore configuré par le bot.</p>
                      )}
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-2">
                        {isIntegrationComplete && accessUrl && (
                           <Button asChild variant="default" size="sm" className="w-full">
                                <a href={accessUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-2 h-4 w-4"/> Accéder à l'Espace Cloud
                                </a>
                           </Button>
                        )}
                        <Button variant="outline" size="sm" disabled className="w-full">Gérer (Bientôt)</Button>
                    </CardFooter>
                  </Card>
                );
              })}
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
                    <li><strong><span className="text-primary">P.A.N.D.A.</span> Notifie le Webhook Général Discord :</strong> L&apos;application <span className="text-primary">P.A.N.D.A.</span> envoie un message formaté (contenant le nom de l&apos;espace, votre nom d&apos;utilisateur/email <span className="text-primary">P.A.N.D.A.</span>, l&apos;ID utilisateur <span className="text-primary">P.A.N.D.A.</span>, et un ID unique pour l&apos;espace cloud) au webhook général Discord (configuré côté serveur PANDA via la variable d&apos;environnement <code className="bg-muted px-1 rounded text-xs">DISCORD_GENERAL_WEBHOOK_URL</code>. Le vôtre est: <code className="bg-muted px-1 rounded text-xs">{SCHEMA_DISCORD_GENERAL_WEBHOOK_URL ? SCHEMA_DISCORD_GENERAL_WEBHOOK_URL.substring(0,50) + "..." : "NON_CONFIGURÉ_CÔTÉ_SERVEUR"}</code>).</li>
                    <li><strong>Action du Bot Discord <span className="text-primary">P.A.N.D.A.</span> (votre bot) :</strong> Votre bot Discord (hébergé séparément, ex: dans un dossier <code className="bg-muted px-1 rounded text-xs">discordbot/</code>, utilisant son propre token <code className="bg-muted px-1 rounded text-xs">MTM4...</code> et l&apos;ID de votre serveur Discord <code className="bg-muted px-1 rounded text-xs">1380...</code>) écoute les messages arrivant sur ce webhook général.
                        <ul className="list-disc pl-5 space-y-1 mt-1">
                           <li>Quand il détecte le message de PANDA, il crée un nouveau salon textuel privé sur votre serveur Discord (ex: <code className="bg-muted px-1 rounded text-xs">#cloud-votrenom-idcourt</code>).</li>
                           <li>Il génère un webhook Discord unique pour ce nouveau salon privé.</li>
                           <li>**Crucial :** Le bot appelle ensuite l&apos;API <span className="text-primary">P.A.N.D.A.</span> (<code className="bg-muted px-1 rounded text-xs">PUT /api/pod/cloud/[ID_ESPACE_CLOUD_PANDA]/discord-integration</code>) pour transmettre à <span className="text-primary">P.A.N.D.A.</span> l&apos;URL de ce webhook privé et l&apos;ID du salon privé.</li>
                           <li>Le bot vous notifie dans le salon privé et/ou le salon général (par exemple, en mentionnant votre utilisateur Discord si possible).</li>
                        </ul>
                    </li>
                    <li><strong><span className="text-primary">P.A.N.D.A.</span> Stocke les Informations :</strong> <span className="text-primary">P.A.N.D.A.</span> enregistre l&apos;URL du webhook privé et l&apos;ID du salon privé dans sa base de données, associés à votre espace cloud.</li>
                    <li><strong>Interaction via URL <span className="text-primary">P.A.N.D.A.</span> :</strong> Votre espace cloud <span className="text-primary">P.A.N.D.A.</span> devient alors interactive via l&apos;URL publique unique : <code className="bg-muted px-1 rounded text-xs">{PANDA_CLOUD_APP_BASE_URL || "URL_NON_CONFIGURÉE"}/?webhook=URL_DU_WEBHOOK_PRIVÉ_STOCKÉE_PAR_PANDA</code>. Lorsque vous (ou un service PANDA) envoyez des données (fichiers, commandes, etc.) à cette URL <span className="text-primary">P.A.N.D.A.</span>, PANDA utilisera le webhook privé stocké pour transmettre ces données à votre salon Discord dédié.</li>
                </ol>
                 <p className="mt-2 text-xs text-muted-foreground">Les identifiants de votre bot Discord (token, ID du salon général d&apos;écoute, ID du rôle admin pour les permissions) sont gérés par votre bot dans son propre environnement (ex: fichier <code className="bg-muted px-1 rounded text-xs">.env</code> du bot). PANDA utilise uniquement le webhook général que vous lui avez fourni dans ses variables d&apos;environnement.</p>
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
