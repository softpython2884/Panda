
"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PlusCircle, Globe, Edit3, Trash2, ExternalLink, Server, Link2, Loader2, AlertTriangle } from "lucide-react";
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
} from "@/components/ui/alert-dialog"

interface Service {
  id: string;
  name: string;
  description: string;
  domain: string;
  type: string;
  public_url?: string;
  local_url: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

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
    fetchServices();
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
        <p className="ml-3 text-muted-foreground">Loading your services...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-headline font-bold">My Services</h1>
        <Button asChild>
          <Link href="/dashboard/register-service">
            <PlusCircle className="mr-2 h-5 w-5" /> Register New Service
          </Link>
        </Button>
      </div>

      {error && (
        <Card className="bg-destructive/10 border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle />Error Fetching Services</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button onClick={() => window.location.reload()} variant="destructive" className="mt-4">Try Again</Button>
          </CardContent>
        </Card>
      )}

      {!error && services.length === 0 && (
        <Card className="text-center py-12">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">No Services Yet</CardTitle>
            <CardDescription>You haven&apos;t registered any services. Get started by adding your first one!</CardDescription>
          </CardHeader>
          <CardContent>
             <Image src="https://placehold.co/300x200.png?text=No+Services" alt="No services placeholder" width={300} height={200} className="mx-auto mb-6 rounded-md" data-ai-hint="empty state illustration" />
            <Button asChild size="lg">
              <Link href="/dashboard/register-service">
                <PlusCircle className="mr-2 h-5 w-5" /> Register Your First Service
              </Link>
            </Button>
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
                  <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">{service.type}</span>
                </div>
                <CardDescription className="flex items-center gap-1 text-sm pt-1">
                  <Globe className="h-4 w-4 text-primary" />{service.domain}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-muted-foreground text-sm mb-3 line-clamp-3">{service.description}</p>
                {service.public_url && (
                  <div className="text-sm flex items-center gap-1 mb-1">
                    <ExternalLink className="h-3 w-3 text-accent" />
                    Public: <a href={service.public_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline truncate">{service.public_url}</a>
                  </div>
                )}
                <div className="text-sm flex items-center gap-1">
                  <Server className="h-3 w-3 text-muted-foreground" />
                  Local: <span className="text-muted-foreground truncate">{service.local_url}</span>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 flex gap-2">
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <Link href={`/manager/service/${service.id}`}><Edit3 className="h-4 w-4 mr-1" /> Edit</Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="flex-1"><Trash2 className="h-4 w-4 mr-1" /> Delete</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your service
                        &quot;{service.name}&quot; and remove its data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteService(service.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
