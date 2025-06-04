
"use client";

import { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2, PlusCircle, Trash2, Copy, Eye, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ApiTokenCreateSchema, type ApiTokenCreateInput, type ApiTokenDisplay } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ApiTokensManager() {
  const [tokens, setTokens] = useState<ApiTokenDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingTokens, setIsFetchingTokens] = useState(true);
  const [showNewTokenModal, setShowNewTokenModal] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<ApiTokenCreateInput>({
    resolver: zodResolver(ApiTokenCreateSchema),
    defaultValues: {
      name: "",
      expiresAt: null,
    },
  });

  const fetchTokens = async () => {
    setIsFetchingTokens(true);
    try {
      const response = await fetch('/api/settings/api-tokens');
      if (!response.ok) throw new Error('Failed to fetch API tokens');
      const data = await response.json();
      setTokens(data.tokens || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsFetchingTokens(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  async function onSubmit(values: ApiTokenCreateInput) {
    setIsLoading(true);
    try {
      const response = await fetch('/api/settings/api-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (response.ok) {
        setNewToken(data.rawToken); // Store the raw token to show in modal
        setShowNewTokenModal(true);
        toast({ title: "Token Créé", description: "Votre nouveau token a été créé. Copiez-le maintenant, vous ne pourrez plus le voir." });
        fetchTokens(); // Refresh the list
        form.reset();
      } else {
        throw new Error(data.error || "Failed to create token");
      }
    } catch (error: any) {
      toast({ title: "Erreur de Création", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  const handleRevokeToken = async (tokenId: string) => {
    try {
      const response = await fetch(`/api/settings/api-tokens/${tokenId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        toast({ title: "Token Révoqué", description: "Le token a été révoqué avec succès." });
        fetchTokens();
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to revoke token");
      }
    } catch (error: any) {
      toast({ title: "Erreur de Révocation", description: error.message, variant: "destructive" });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copié!", description: "Token copié dans le presse-papiers." });
    }).catch(err => {
      toast({ title: "Échec", description: "Impossible de copier le token.", variant: "destructive" });
    });
  };

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4 border rounded-lg shadow-sm">
          <h3 className="text-lg font-medium">Créer un nouveau Token d&apos;API</h3>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom du Token</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: MonAppDeBackup" {...field} />
                </FormControl>
                <FormDescription>Un nom descriptif pour identifier ce token.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="expiresAt"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date d&apos;expiration (Optionnel)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: fr })
                        ) : (
                          <span>Choisissez une date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={(date) => field.onChange(date || null)}
                      disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>Laissez vide pour un token qui n&apos;expire jamais.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
            Créer le Token
          </Button>
        </form>
      </Form>

      <AlertDialog open={showNewTokenModal} onOpenChange={setShowNewTokenModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nouveau Token d&apos;API Créé !</AlertDialogTitle>
            <Alert variant="destructive" className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Important: Copiez votre token maintenant !</AlertTitle>
                <AlertDescription>
                C&apos;est la <strong>seule fois</strong> que vous pourrez voir ce token. Gardez-le en sécurité. Si vous le perdez, vous devrez en créer un nouveau.
                </AlertDescription>
            </Alert>
            <div className="mt-4 p-3 bg-muted rounded-md text-sm font-mono break-all relative">
              {newToken}
              <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={() => newToken && copyToClipboard(newToken)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => {setShowNewTokenModal(false); setNewToken(null);}}>J&apos;ai copié mon token</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <div>
        <h3 className="text-lg font-medium mb-4">Tokens Existants</h3>
        {isFetchingTokens ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground">Chargement des tokens...</p>
          </div>
        ) : tokens.length === 0 ? (
          <p className="text-muted-foreground">Vous n&apos;avez aucun token d&apos;API.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Préfixe du Token</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead>Expire le</TableHead>
                <TableHead>Dernière Utilisation</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tokens.map((token) => (
                <TableRow key={token.id}>
                  <TableCell>{token.name}</TableCell>
                  <TableCell><code className="font-mono bg-muted px-1 rounded">{token.tokenPrefix}...</code></TableCell>
                  <TableCell>{format(new Date(token.createdAt), "dd/MM/yyyy HH:mm", { locale: fr })}</TableCell>
                  <TableCell>{token.expiresAt ? format(new Date(token.expiresAt), "dd/MM/yyyy", { locale: fr }) : "Jamais"}</TableCell>
                  <TableCell>{token.lastUsedAt ? format(new Date(token.lastUsedAt), "dd/MM/yyyy HH:mm", { locale: fr }) : "Jamais"}</TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Révoquer le token &quot;{token.name}&quot;?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action est irréversible. Le token sera définitivement supprimé.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRevokeToken(token.id)}>Révoquer</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
