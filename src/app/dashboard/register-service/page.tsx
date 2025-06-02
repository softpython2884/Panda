
import RegisterServiceForm from "@/components/dashboard/RegisterServiceForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function RegisterServicePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="outline" asChild className="mb-6">
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Register New Service</CardTitle>
          <CardDescription>Add your service to the PANDA Ecosystem. Fill out the details below.</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterServiceForm />
        </CardContent>
      </Card>
    </div>
  );
}
