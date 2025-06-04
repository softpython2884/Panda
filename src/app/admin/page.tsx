
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, Server } from "lucide-react";

export default function AdminDashboardPage() {
  // In a real app, you'd fetch stats here
  const stats = {
    totalUsers: 0, // Placeholder
    totalServices: 0, // Placeholder
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-headline font-bold text-destructive">Admin Dashboard</h1>
      <p className="text-muted-foreground">Overview of the PANDA Ecosystem.</p>

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
        {/* Add more stat cards as needed */}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <Button asChild variant="outline">
            <Link href="/admin/users">Manage Users</Link>
          </Button>
          {/* <Button asChild variant="outline">
            <Link href="/admin/services">Manage Services</Link>
          </Button> */}
        </div>
      </div>
    </div>
  );
}
