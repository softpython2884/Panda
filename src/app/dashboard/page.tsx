
"use client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Waypoints, Archive, Activity, ArrowRight, Loader2, Infinity as InfinityIcon, Server } from "lucide-react"; // Changed Gauge to Server
import { useEffect, useState } from "react";
import RoleBadge from "@/components/shared/RoleBadge";
import { RolesConfig } from "@/lib/schemas";

interface RecentService {
  id: string;
  name: string;
  type: string; 
  public_url: string;
}

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const [recentTunnels, setRecentTunnels] = useState<RecentService[]>([]);
  const [isLoadingTunnels, setIsLoadingTunnels] = useState(false); 

  useEffect(() => {
    async function fetchRecentTunnels() {
      if (!user) return;
      setIsLoadingTunnels(true);
      try {
        const response = await fetch('/api/dashboard/services?limit=3'); 
        if (response.ok) {
          const data = await response.json();
          setRecentTunnels(data); 
        } else {
          console.error("Failed to fetch recent tunnels");
        }
      } catch (error) {
        console.error("Error fetching recent tunnels:", error);
      } finally {
        setIsLoadingTunnels(false);
      }
    }
    fetchRecentTunnels();
  }, [user]);

  const capitalizeFirstLetter = (string?: string | null) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const getDisplayName = () => {
    if (!user) return "";
    if (user.firstName) return capitalizeFirstLetter(user.firstName);
    if (user.username) return capitalizeFirstLetter(user.username);
    return capitalizeFirstLetter(user.email);
  };
  
  const displayName = getDisplayName();
  const userQuotaConfig = user ? RolesConfig[user.role] : RolesConfig.FREE;

  return (
    <div className="space-y-10">
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 mb-3">
            <h1 className="text-4xl md:text-5xl font-headline font-bold">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                Bonjour, {displayName}!
            </span>
            </h1>
            {user && <RoleBadge role={user.role} className="mt-2 sm:mt-0 text-base px-3 py-1.5" />}
        </div>
        <p className="text-xl text-muted-foreground">
          Bienvenue sur votre tableau de bord PANDA. Gérez vos services et explorez l'écosystème.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-headline font-semibold flex items-center gap-2">
          <Activity className="h-7 w-7 text-primary" />
          Mes Projets Actifs
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="font-headline text-xl flex items-center gap-2">
                <Waypoints className="text-primary" />
                Mes Derniers Tunnels
              </CardTitle>
              <CardDescription>Accédez rapidement à vos services tunnelisés les plus récents.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoadingTunnels && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="ml-2 text-muted-foreground">Chargement des tunnels...</p>
                </div>
              )}
              {!isLoadingTunnels && recentTunnels.length === 0 && (
                <p className="text-muted-foreground text-sm">Aucun service tunnel trouvé pour le moment.</p>
              )}
              {!isLoadingTunnels && recentTunnels.map(tunnel => (
                <div key={tunnel.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                  <div>
                    <p className="font-semibold text-sm">{tunnel.name}</p>
                    <p className="text-xs text-muted-foreground">{tunnel.public_url}</p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/manager/service/${tunnel.id}`}>
                      Gérer <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/dashboard/tunnels">Voir tous mes Tunnels <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow opacity-80">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="font-headline text-xl flex items-center gap-2">
                  <Archive className="text-accent" /> 
                  Mon Espace Cloud PANDA
                </CardTitle>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Server className="h-4 w-4" />
                  {userQuotaConfig.maxCloudServers === Infinity ? (
                    <InfinityIcon className="h-4 w-4" />
                  ) : (
                    `${userQuotaConfig.maxCloudServers} serveur(s)`
                  )}
                </div>
              </div>
              <CardDescription>Hébergez vos serveurs cloud personnels et partagez des fichiers. (Bientôt disponible !)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground text-sm">
                Imaginez pouvoir déployer vos propres instances cloud pour vos projets, avec un stockage illimité par serveur, et partager des fichiers de manière sécurisée.
              </p>
              <div className="mt-4 p-3 bg-muted/50 rounded-md">
                <p className="text-sm font-semibold text-primary">Fonctionnalités à venir :</p>
                <ul className="list-disc list-inside text-xs text-muted-foreground mt-1 space-y-0.5">
                  <li>Création et gestion de serveurs cloud.</li>
                  <li>Stockage et organisation de fichiers par serveur.</li>
                  <li>Partage de fichiers/dossiers avec d'autres utilisateurs PANDA.</li>
                  <li>Liens de partage publics sécurisés.</li>
                </ul>
              </div>
               <p className="text-xs text-muted-foreground italic text-center pt-2">
                Nous construisons un espace cloud robuste et flexible pour vos besoins !
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" disabled>
                <Link href="/dashboard/cloud">Explorer mon Cloud (Prochainement) <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>
    </div>
  );
}
