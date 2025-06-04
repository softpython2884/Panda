
import EditServiceForm from "@/components/manager/EditServiceForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface EditServicePageProps {
  params: {
    id: string;
  };
}

export default function EditServicePage({ params }: EditServicePageProps) {
  const { id: serviceId } = params;

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
          <CardTitle className="text-3xl font-headline">Edit PANDA Tunnel Service</CardTitle>
          <CardDescription>Update the details for your tunnel service. Changes will affect your client configuration.</CardDescription>
        </CardHeader>
        <CardContent>
          <EditServiceForm serviceId={serviceId} />
        </CardContent>
      </Card>
    </div>
  );
}
