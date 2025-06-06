
"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PlusCircle, Globe, Edit3, Trash2, Server, Loader2, AlertTriangle, PackageSearch, DownloadCloud, Waypoints, Infinity as InfinityIcon } from "lucide-react";
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
import { RolesConfig, UserRoleDisplayConfig } from "@/lib/schemas"; 
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";


interface Service {
  id: string;
  name: string;
  description: string;
  domain: string; 
  type: string; 
  public_url: string;
  local_port?: number;
}

export default function TunnelsDashboardPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const userRole = user?.role || 'FREE';
  const userQuotaConfig = user ? RolesConfig[userRole] : RolesConfig.FREE;
  const canCreateMoreTunnels = user ? userQuotaConfig.maxTunnels === Infinity || services.length < userQuotaConfig.maxTunnels : false;


  useEffect(() => {
    async function fetchServices() {
      if (!user) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/dashboard/services');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch services');
        }
        const data = await response.json();
        setServices(data);
      } catch (err: any) {
        setError(err.message);
        toast({ title: "Error", description: err.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    if (user) { 
        fetchServices();
    } else {
        setIsLoading(false); 
    }
  }, [user, toast]);

  const handleDeleteService = async (serviceId: string) => {
    try {
      const response = await fetch(`/api/manager/service/${serviceId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete service');
      }
      setServices(prevServices => prevServices.filter(s => s.id !== serviceId));
      toast({ title: "Success", description: "Service deleted successfully." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-300px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Loading your tunnel services...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-headline font-bold">Mes Services Tunnels</h1>
            <p className="text-muted-foreground">Gérez, modifiez ou supprimez vos configurations de tunnels.</p>
        </div>
        <Button asChild disabled={!canCreateMoreTunnels}>
          <Link href="/dashboard/register-service">
            <PlusCircle className="mr-2 h-5 w-5" /> Enregistrer un Nouveau Tunnel
          </Link>
        </Button>
      </div>
      
      <Alert variant="default" className="shadow-sm">
        <Waypoints className="h-5 w-5" />
        <AlertTitle className="font-semibold">Vos Quotas de Tunnels</AlertTitle>
        <AlertDescription>
          Votre grade ({UserRoleDisplayConfig[userRole].label}) vous donne droit à :&nbsp;
          {userQuotaConfig.maxTunnels === Infinity ? (
            <span className="inline-flex items-center gap-1">
              <InfinityIcon className="h-4 w-4 text-green-600" /> 
              <span>tunnels illimités.</span>
            </span>
          ) : (
            <span>
              <strong className="text-primary">{services.length}</strong> sur <strong className="text-primary">{userQuotaConfig.maxTunnels}</strong> tunnel(s) utilisé(s).
            </span>
          )}
          {!canCreateMoreTunnels && userQuotaConfig.maxTunnels !== Infinity && (
            <span className="text-destructive font-medium ml-1"> Vous avez atteint votre limite.</span>
          )}
        </AlertDescription>
      </Alert>

      {error && (
        <Card className="bg-destructive/10 border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle /> Erreur de Chargement</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button onClick={() => window.location.reload()} variant="destructive" className="mt-4">Réessayer</Button>
          </CardContent>
        </Card>
      )}

      {!error && services.length === 0 && (
        <Card className="text-center py-12 shadow-md">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Aucun Service Tunnel Enregistré</CardTitle>
            <CardDescription>Vous n'avez pas encore configuré de tunnels. Commencez dès maintenant !</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
             <PackageSearch className="h-24 w-24 text-muted-foreground mb-6" />
            <Button asChild size="lg" disabled={!canCreateMoreTunnels}>
              <Link href="/dashboard/register-service">
                <PlusCircle className="mr-2 h-5 w-5" /> Enregistrer votre Premier Tunnel
              </Link>
            </Button>
             {!canCreateMoreTunnels && userQuotaConfig.maxTunnels !== Infinity && (
                 <p className="text-sm text-destructive mt-4">Vous avez atteint votre quota de tunnels pour votre grade actuel.</p>
            )}
          </CardContent>
        </Card>
      )}

      {!error && services.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card key={service.id} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="font-headline text-xl">{service.name}</CardTitle>
                  <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full uppercase">{service.type}</span>
                </div>
                <CardDescription className="flex items-center gap-1 text-sm pt-1">
                  <Globe className="h-4 w-4 text-primary" />
                  <a 
                    href={service.public_url.startsWith('http') ? service.public_url : `http://${service.public_url}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline hover:text-accent transition-colors truncate"
                    title={`Access ${service.public_url}`}
                  >
                    {service.public_url}
                  </a>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-muted-foreground text-sm mb-3 line-clamp-3">{service.description}</p>
                <div className="text-sm flex items-center gap-1">
                  <Server className="h-3 w-3 text-muted-foreground" />
                  Port Local: <span className="text-muted-foreground">{service.local_port || 'N/A'}</span>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild className="flex-grow min-w-[calc(50%-0.5rem)] sm:flex-grow-0 sm:flex-1">
                  <Link href={`/manager/service/${service.id}`}><Edit3 className="h-4 w-4 mr-1" /> Éditer</Link>
                </Button>
                 <Button variant="secondary" size="sm" asChild className="flex-grow min-w-[calc(50%-0.5rem)] sm:flex-grow-0 sm:flex-1">
                  <Link href={`/dashboard/service/${service.id}/client-config`}><DownloadCloud className="h-4 w-4 mr-1" /> Obtenir Config</Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="w-full mt-2 sm:mt-0 sm:w-auto sm:flex-1"> 
                      <Trash2 className="h-4 w-4 mr-1" /> Supprimer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible. Le service tunnel &quot;{service.name}&quot; sera supprimé définitivement de PANDA.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteService(service.id)}>
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      <p className="text-center text-xs text-muted-foreground mt-10 italic">
        <span className="text-primary">P</span>roxying <span className="text-primary">A</span>nd <span className="text-primary">N</span>etwork <span className="text-primary">D</span>irect <span className="text-primary">A</span>ccess
      </p>
    </div>
  );
}
    

    