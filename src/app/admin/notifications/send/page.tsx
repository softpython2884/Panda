
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, UserSearch, ArrowLeft } from "lucide-react";
import { NotificationTypeSchema, type NotificationType } from "@/lib/schemas";
import Link from "next/link";

const SendNotificationFormSchema = z.object({
  userId: z.string().uuid("L'ID utilisateur doit être un UUID valide."),
  message: z.string().min(5, "Le message doit contenir au moins 5 caractères.").max(1000, "Le message ne peut pas dépasser 1000 caractères."),
  type: NotificationTypeSchema.default('admin_message'),
  link: z.string().url("Le lien doit être une URL valide (ex: https://example.com/page).").optional().nullable().or(z.literal('')),
});
type SendNotificationFormValues = z.infer<typeof SendNotificationFormSchema>;

interface SimpleUser {
  id: string;
  display: string; // e.g., "username (email)"
}

export default function AdminSendNotificationPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);

  const form = useForm<SendNotificationFormValues>({
    resolver: zodResolver(SendNotificationFormSchema),
    defaultValues: {
      userId: "",
      message: "",
      type: 'admin_message',
      link: "",
    },
  });

  // Fetch users for the select dropdown (simplified)
  useEffect(() => {
    const fetchUsersForSelect = async () => {
      setIsFetchingUsers(true);
      try {
        const response = await fetch('/api/admin/users'); // Reuse existing admin users route
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        const mappedUsers: SimpleUser[] = (data.users || []).map((u: any) => ({
          id: u.id,
          display: `${u.username || 'N/A'} (${u.email}) - ID: ${u.id.substring(0,8)}...`,
        }));
        setUsers(mappedUsers);
      } catch (error) {
        toast({ title: "Erreur", description: "Impossible de charger la liste des utilisateurs.", variant: "destructive" });
      } finally {
        setIsFetchingUsers(false);
      }
    };
    fetchUsersForSelect();
  }, [toast]);


  async function onSubmit(values: SendNotificationFormValues) {
    setIsLoading(true);
    try {
      const payload = {
        ...values,
        link: values.link === "" ? null : values.link, // Ensure empty string becomes null
      };
      const response = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const responseData = await response.json();
      if (response.ok) {
        toast({ title: "Succès", description: responseData.message || "Notification envoyée." });
        form.reset();
      } else {
        throw new Error(responseData.error || "Échec de l'envoi de la notification.");
      }
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Button variant="outline" asChild className="mb-4">
        <Link href="/admin"><ArrowLeft className="mr-2 h-4 w-4" /> Retour au Panel Admin</Link>
      </Button>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-destructive">Envoyer une Notification</CardTitle>
          <CardDescription>Envoyez un message ciblé à un utilisateur spécifique du système PANDA.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Utilisateur Cible</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isFetchingUsers}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isFetchingUsers ? "Chargement des utilisateurs..." : "Sélectionner un utilisateur"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.length === 0 && !isFetchingUsers && <SelectItem value="no-users" disabled>Aucun utilisateur trouvé</SelectItem>}
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.display}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Choisissez l'utilisateur qui recevra cette notification.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message de la Notification</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Entrez votre message ici..." {...field} rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de Notification</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {NotificationTypeSchema.options.map((typeValue) => (
                          <SelectItem key={typeValue} value={typeValue}>
                            {typeValue.charAt(0).toUpperCase() + typeValue.slice(1).replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Le type de notification affecte son icône et potentiellement son comportement.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lien (Optionnel)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://domaine.com/page-pertinente" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormDescription>Si fourni, cliquer sur la notification redirigera vers ce lien.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading || isFetchingUsers} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Envoyer la Notification
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
