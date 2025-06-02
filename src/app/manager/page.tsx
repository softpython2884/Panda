
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";
import Link from "next/link";

export default function ManagerHomePage() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">PANDA Service Manager</CardTitle>
          <CardDescription>Manage your registered PANDA services.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Info className="h-16 w-16 text-primary mx-auto" />
          <p className="text-muted-foreground">
            To manage a specific service, please navigate to your PANDA Dashboard, find the service you wish to edit, and click the &quot;Edit&quot; button.
          </p>
          <p className="text-muted-foreground">
            This page is a placeholder. Future versions might allow direct service lookup via domain.
          </p>
          <Button asChild size="lg" className="mt-4">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
