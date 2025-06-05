
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ServerCog, Construction } from "lucide-react";

export default function AdminServicesPage() {
  // In a real app, you'd fetch and display services here
  // For now, it's a placeholder.

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-destructive">Service Management</CardTitle>
          <CardDescription>View and manage all registered services in the PANDA system.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center min-h-[300px]">
          <Construction className="h-24 w-24 text-primary mb-6" />
          <h2 className="text-2xl font-headline font-bold text-primary">En cours de développement</h2>
          <p className="text-lg text-muted-foreground max-w-md mt-2">
            Cette section permettra bientôt de visualiser et de gérer tous les services PANDA enregistrés.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/admin">Retour au Dashboard Admin</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
