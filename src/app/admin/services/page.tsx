
import ServiceManagementTable from "@/components/admin/ServiceManagementTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminServicesManagementPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-destructive">Gestion de Tous les Services</CardTitle>
          <CardDescription>Visualisez tous les services enregistrés dans le système PANDA.</CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceManagementTable />
        </CardContent>
      </Card>
    </div>
  );
}
