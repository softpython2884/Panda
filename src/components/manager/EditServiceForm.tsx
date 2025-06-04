
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
import { Textarea } from "@/components/ui/textarea";
import { ServiceSchema, type FrpServiceInput, frpServiceTypes, FRP_SERVER_BASE_DOMAIN, FRP_SERVER_ADDR } from "@/lib/schemas";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


interface EditServiceFormProps {
  serviceId: string;
}

export default function EditServiceForm({ serviceId }: EditServiceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);


  const form = useForm<FrpServiceInput>({
    resolver: zodResolver(ServiceSchema),
    defaultValues: {
      name: "",
      description: "",
      localPort: '' as any, 
      subdomain: "",
      frpType: "http", 
      remotePort: undefined,
      useEncryption: true,
      useCompression: false,
    },
  });

  useEffect(() => {
    setIsFetching(true);
    fetch(`/api/manager/service/${serviceId}`)
      .then(res => {
        if (!res.ok) {
           return res.json().then(errData => { throw new Error(errData.error || 'Failed to fetch service details')});
        }
        return res.json();
      })
      .then((data: FrpServiceInput ) => { // API returns data matching FrpServiceInput
        form.reset({
            ...data,
            localPort: data.localPort === undefined || data.localPort === null ? '' : String(data.localPort),
            remotePort: data.remotePort === undefined || data.remotePort === null ? undefined : Number(data.remotePort),
            useEncryption: data.useEncryption === undefined ? true : data.useEncryption,
            useCompression: data.useCompression === undefined ? false : data.useCompression,
        });
      })
      .catch(err => {
        toast({ title: "Error Loading Service", description: err.message, variant: "destructive" });
        router.push("/dashboard"); 
      })
      .finally(() => setIsFetching(false));
  }, [serviceId, form, toast, router]);

  async function onSubmit(values: FrpServiceInput) {
    setIsLoading(true);
    try {
      const payload = {
        ...values,
        localPort: Number(values.localPort),
        remotePort: (values.frpType === 'tcp' || values.frpType === 'udp') && values.remotePort ? Number(values.remotePort) : undefined,
        useEncryption: values.useEncryption,
        useCompression: values.useCompression,
      };
      const response = await fetch(`/api/manager/service/${serviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        toast({ 
            title: "Service Updated", 
            description: `Service "${values.name}" tunnel configuration updated. You MUST get the new client config and restart your local Panda Tunnels Client.`,
            duration: 7000, 
        });
        router.push("/dashboard");
      } else {
        toast({ title: "Update Failed", description: data.error || "Could not update service. The subdomain or remote port might already be in use.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Update Error", description: "An unexpected error occurred during update.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  const frpTypeValue = form.watch("frpType");
  const currentSubdomain = form.watch("subdomain");
  const currentRemotePort = form.watch("remotePort");

  const publicUrlPreview = 
    (frpTypeValue === 'http' || frpTypeValue === 'https') && currentSubdomain
    ? `${currentSubdomain}.${FRP_SERVER_BASE_DOMAIN || '[BASE DOMAIN NOT SET]'}`
    : (frpTypeValue === 'tcp' || frpTypeValue === 'udp') && currentRemotePort
    ? `${FRP_SERVER_ADDR || '[SERVER ADDR NOT SET]'}:${currentRemotePort}`
    : (frpTypeValue === 'stcp' || frpTypeValue === 'xtcp') && currentSubdomain
    ? `${currentSubdomain}.${FRP_SERVER_BASE_DOMAIN || '[BASE DOMAIN NOT SET]'} (pour STCP/XTCP, configuration serveur spécifique requise)`
    : `(Configurez type et accès)`;


  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading service details...</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Alert variant="default">
          <Info className="h-4 w-4" />
          <AlertTitle>Important: Application des Changements de Configuration</AlertTitle>
          <AlertDescription>
            Après avoir sauvegardé les changements ici, l&apos;enregistrement de votre service PANDA est mis à jour.
            Ces changements ne sont <strong>pas automatiquement appliqués</strong> à votre <code className="font-mono bg-muted px-1 rounded">Panda Tunnels Client</code> en cours d&apos;exécution.
            <br />Vous <strong>devez</strong> aller sur la page &quot;Obtenir la Configuration&quot; pour ce service (depuis le tableau de bord), obtenir le nouveau contenu du fichier <code className="font-mono bg-muted px-1 rounded">pandaconfig.toml</code>, mettre à jour votre fichier local, puis <strong>redémarrer votre <code className="font-mono bg-muted px-1 rounded">Panda Tunnels Client</code></strong> pour que les nouveaux paramètres prennent effet.
            <br />Les utilisateurs avancés peuvent aussi directement éditer leur <code className="font-mono bg-muted px-1 rounded">pandaconfig.toml</code> local pour des options non gérées par cette interface, en consultant la documentation officielle de <strong className="text-primary">frp</strong>.
          </AlertDescription>
        </Alert>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du Service (pour PANDA & ID du Tunnel)</FormLabel>
              <FormControl>
                <Input placeholder="MonServeurDeJeu" {...field} />
              </FormControl>
              <FormDescription>Un nom unique pour votre service. Utilisé dans la configuration du tunnel. Caractères autorisés : lettres, chiffres, tirets, et underscores.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Brève description de votre service (ex: Serveur Minecraft, Blog Personnel)." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <div className="grid md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="localPort"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Port Local</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="ex: 3000 ou 25565"
                    {...field}
                    onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                    value={field.value === undefined || field.value === null ? '' : String(field.value)}
                  />
                </FormControl>
                <FormDescription>Le port sur lequel votre service tourne localement.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="frpType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type de Tunnel</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un type de tunnel" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {frpServiceTypes.map((type) => (
                       <SelectItem key={type} value={type}>
                        {type.toUpperCase()}
                        {type === 'stcp' && ' (TCP Secret)'}
                        {type === 'xtcp' && ' (TCP P2P)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Protocole de votre service local. Pour Minecraft (Java), utilisez TCP et le port 25565.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {(frpTypeValue === 'http' || frpTypeValue === 'https' || frpTypeValue === 'stcp' || frpTypeValue === 'xtcp') && (
            <FormField
                control={form.control}
                name="subdomain"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Sous-domaine souhaité</FormLabel>
                    <FormControl>
                    <Input placeholder="monsuperservice" {...field} />
                    </FormControl>
                    <FormDescription>
                     Utilisé pour les types HTTP, HTTPS, STCP, XTCP. Votre service sera accessible à <code className="bg-muted px-1 py-0.5 rounded">{publicUrlPreview}</code>.
                    Utilisez des lettres minuscules, chiffres, et tirets.
                    </FormDescription>
                    <FormMessage />
                </FormItem>
                )}
            />
        )}
        
        {(frpTypeValue === 'tcp' || frpTypeValue === 'udp') && (
            <FormField
                control={form.control}
                name="remotePort"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Port distant souhaité sur le serveur</FormLabel>
                    <FormControl>
                    <Input 
                        type="number" 
                        placeholder="ex: 7001 (doit être unique sur le serveur)" 
                        {...field}
                        onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                        value={field.value === undefined || field.value === null ? '' : String(field.value)}
                    />
                    </FormControl>
                    <FormDescription>
                    Requis pour les types TCP/UDP. Votre service sera accessible à <code className="bg-muted px-1 py-0.5 rounded">{publicUrlPreview}</code>.
                    </FormDescription>
                    <FormMessage />
                </FormItem>
                )}
            />
        )}

        <Accordion type="single" collapsible className="w-full" defaultValue={ (form.getValues("useEncryption") !== true || form.getValues("useCompression") !== false) ? "advanced-settings" : undefined }>
          <AccordionItem value="advanced-settings">
            <AccordionTrigger className="text-sm font-medium">
                Paramètres Avancés
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-6">
              <FormField
                control={form.control}
                name="useEncryption"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        id="useEncryptionEdit"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel htmlFor="useEncryptionEdit" className="cursor-pointer">
                        Activer l&apos;Encryption du tunnel (Client &lt;-&gt; Serveur Panda Tunnels)
                      </FormLabel>
                      <FormDescription>
                        Chiffre les données entre le Panda Tunnels Client et le Panda Tunnels Server (recommandé). Affecte `transport.useEncryption` dans `pandaconfig.toml`.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="useCompression"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        id="useCompressionEdit"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel htmlFor="useCompressionEdit" className="cursor-pointer">
                        Activer la Compression du tunnel (Client &lt;-&gt; Serveur Panda Tunnels)
                      </FormLabel>
                      <FormDescription>
                        Compresse les données. Peut améliorer la vitesse sur des connexions lentes mais augmente l&apos;usage CPU. Affecte `transport.useCompression` dans `pandaconfig.toml`.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Button type="submit" className="w-full sm:w-auto" disabled={isLoading || isFetching}>
          {(isLoading || isFetching) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Sauvegarder les Modifications du Tunnel
        </Button>
      </form>
    </Form>
  );
}
