
"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { Button } from "../ui/button";

interface ServiceForAdmin {
  id: string;
  name: string;
  description: string | null;
  public_url: string | null;
  domain: string;
  type: string;
  local_port: number | null;
  remote_port: number | null;
  created_at: string;
  user_id: string;
  user_email: string;
}

export default function ServiceManagementTable() {
  const [services, setServices] = useState<ServiceForAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchServices = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/admin/services");
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to fetch services");
        }
        const data = await response.json();
        setServices(data.services || []);
      } catch (error: any) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchServices();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Chargement des services...</p>
      </div>
    );
  }

  if (services.length === 0) {
    return <p className="text-muted-foreground">Aucun service trouvé.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nom du Service</TableHead>
          <TableHead>Utilisateur</TableHead>
          <TableHead>Domaine/URL Publique</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Port Local</TableHead>
          <TableHead>Port Distant</TableHead>
          <TableHead>Créé le</TableHead>
          {/* <TableHead>Actions</TableHead> */}
        </TableRow>
      </TableHeader>
      <TableBody>
        {services.map((service) => (
          <TableRow key={service.id}>
            <TableCell className="font-medium">{service.name}</TableCell>
            <TableCell>
                <div className="text-sm">{service.user_email}</div>
                <div className="text-xs text-muted-foreground">ID: {service.user_id}</div>
            </TableCell>
            <TableCell>
                {service.public_url ? (
                     <Link href={service.public_url.startsWith('http') ? service.public_url : `http://${service.public_url}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {service.public_url}
                    </Link>
                ) : service.domain}
            </TableCell>
            <TableCell><Badge variant="secondary">{service.type.toUpperCase()}</Badge></TableCell>
            <TableCell>{service.local_port || "-"}</TableCell>
            <TableCell>{service.remote_port || "-"}</TableCell>
            <TableCell>{format(new Date(service.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}</TableCell>
            {/* <TableCell>
              <Button variant="outline" size="sm" disabled>Gérer</Button>
            </TableCell> */}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
