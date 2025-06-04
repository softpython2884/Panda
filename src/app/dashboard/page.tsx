
"use client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Waypoints, Cloud, Activity, ArrowRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

// TODO: Define a more specific type for recent services if needed
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

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-4xl md:text-5xl font-headline font-bold mb-3">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            Bonjour, {displayName}!
          </span>
        </h1>
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

          <Card className="shadow-lg hover:shadow-xl transition-shadow opacity-70">
            <CardHeader>
              <CardTitle className="font-headline text-xl flex items-center gap-2">
                <Cloud className="text-accent" />
                Mon Espace Cloud
              </CardTitle>
              <CardDescription>Gérez vos fichiers et partages (Bientôt disponible!).</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                L'intégration du stockage cloud est en cours de développement. Revenez bientôt pour découvrir cette fonctionnalité !
              </p>
              {/* Placeholder pour "derniers serveurs cloud utilisés" */}
              <div className="mt-4 p-3 bg-muted/50 rounded-md text-center">
                <p className="text-sm text-muted-foreground italic">Aperçu des activités cloud à venir...</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" disabled>
                <Link href="/dashboard/cloud">Accéder à mon Cloud <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>
    </div>
  );
}
