
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, Server, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface AdminStats {
  totalUsers: number;
  totalServices: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, totalServices: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const [usersResponse, servicesResponse] = await Promise.all([
          fetch('/api/admin/users'),
          fetch('/api/admin/services')
        ]);

        let usersCount = 0;
        let servicesCount = 0;

        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          usersCount = usersData.users?.length || 0;
        } else {
          const errorData = await usersResponse.json().catch(() => ({}));
          console.error("Failed to fetch users for admin dashboard:", errorData.error || usersResponse.statusText);
          toast({ title: "Error", description: `Failed to fetch users: ${errorData.error || usersResponse.statusText}`, variant: "destructive" });
        }

        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json();
          servicesCount = servicesData.services?.length || 0;
        } else {
          const errorData = await servicesResponse.json().catch(() => ({}));
          console.error("Failed to fetch services for admin dashboard:", errorData.error || servicesResponse.statusText);
          toast({ title: "Error", description: `Failed to fetch services: ${errorData.error || servicesResponse.statusText}`, variant: "destructive" });
        }
        
        setStats({ totalUsers: usersCount, totalServices: servicesCount });

      } catch (error) {
        console.error("Error fetching admin dashboard stats:", error);
        toast({ title: "Error", description: "Could not load dashboard statistics.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [toast]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-headline font-bold text-destructive">Admin Dashboard</h1>
      <p className="text-muted-foreground">Overview of the PANDA Ecosystem.</p>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 text-muted-foreground">Loading statistics...</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Registered users in the system.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Services</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalServices}</div>
              <p className="text-xs text-muted-foreground">
                Registered tunnels and services.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <Button asChild variant="outline">
            <Link href="/admin/users">Manage Users</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/services">Manage Services</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
