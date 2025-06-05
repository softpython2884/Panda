
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UserProfileUpdateSchema, type UserProfileUpdateInput } from "@/lib/schemas";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Mail } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import RoleBadge from "@/components/shared/RoleBadge";

export default function UserProfileForm() {
  const { user, fetchUser, isCheckingAuthSession } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);

  const form = useForm<UserProfileUpdateInput>({
    resolver: zodResolver(UserProfileUpdateSchema),
    defaultValues: {
      username: "",
      firstName: "",
      lastName: "",
    },
  });

  useEffect(() => {
    if (!isCheckingAuthSession && user) {
      form.reset({
        username: user.username || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
      });
      setIsFetchingProfile(false);
    } else if (!isCheckingAuthSession && !user) {
      setIsFetchingProfile(false);
    }
  }, [user, form, isCheckingAuthSession]);


  async function onSubmit(values: UserProfileUpdateInput) {
    setIsLoading(true);
    try {
      const payload: Partial<UserProfileUpdateInput> = {};
      if (values.username && values.username !== user?.username) payload.username = values.username;
      payload.firstName = values.firstName === "" ? null : values.firstName;
      payload.lastName = values.lastName === "" ? null : values.lastName;
      
      if (payload.firstName === user?.firstName) delete payload.firstName;
      if (payload.lastName === user?.lastName) delete payload.lastName;

      if (Object.keys(payload).length === 0 && !(values.username && values.username !== user?.username)) {
        toast({ title: "Aucun Changement", description: "Vous n'avez fait aucune modification à votre profil." });
        setIsLoading(false);
        return;
      }
      
      const response = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast({ title: "Profil Mis à Jour", description: "Vos informations de profil ont été sauvegardées." });
        await fetchUser(); 
      } else {
        toast({ title: "Échec de la Mise à Jour", description: data.error || "Impossible de mettre à jour le profil.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erreur de Mise à Jour", description: "Une erreur inattendue est survenue.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }
  
  if (isCheckingAuthSession || isFetchingProfile) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Chargement du profil...</p>
      </div>
    );
  }
  
  if (!user) { 
    return (
         <Alert variant="destructive">
            <Mail className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>Impossible de charger le profil utilisateur. Veuillez vérifier que vous êtes connecté.</AlertDescription>
        </Alert>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md border">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{user?.email}</span>
                </div>
                {user?.role && <RoleBadge role={user.role} className="mt-2 sm:mt-0"/>}
            </div>
            <FormDescription>Votre adresse email ne peut pas être modifiée ici. Votre grade actuel est affiché ci-dessus.</FormDescription>
        </div>

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pseudo (Nom d'utilisateur)</FormLabel>
              <FormControl>
                <Input placeholder="VotrePseudoUnique" {...field} />
              </FormControl>
              <FormDescription>C'est votre nom d'affichage public. Il doit être unique.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Prénom</FormLabel>
                <FormControl>
                    <Input placeholder="Votre prénom (optionnel)" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Nom de Famille</FormLabel>
                <FormControl>
                    <Input placeholder="Votre nom de famille (optionnel)" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        
        <Button type="submit" className="w-full sm:w-auto" disabled={isLoading || !form.formState.isDirty}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Sauvegarder les Changements
        </Button>
      </form>
    </Form>
  );
}
