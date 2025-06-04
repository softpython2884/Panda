
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
import { ServiceSchema, type FrpServiceInput, frpServiceTypes, FRP_SERVER_BASE_DOMAIN } from "@/lib/schemas";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Settings2, ChevronDown, ChevronUp } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


export default function RegisterServiceForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const form = useForm<FrpServiceInput>({
    resolver: zodResolver(ServiceSchema),
    defaultValues: {
      name: "",
      description: "",
      localPort: '' as any, 
      subdomain: "",
      frpType: "http",
      remotePort: undefined, // Default to undefined
      useEncryption: true,
      useCompression: false,
    },
  });

  const frpTypeValue = form.watch("frpType");
  const currentSubdomain = form.watch("subdomain");
  const currentRemotePort = form.watch("remotePort");

  const publicUrlPreview = 
    (frpTypeValue === 'http' || frpTypeValue === 'https') && currentSubdomain
    ? `${currentSubdomain}.${FRP_SERVER_BASE_DOMAIN}`
    : (frpTypeValue === 'tcp' || frpTypeValue === 'udp') && currentRemotePort
    ? `${FRP_SERVER_ADDR}:${currentRemotePort}`
    : (frpTypeValue === 'stcp' || frpTypeValue === 'xtcp') && currentSubdomain
    ? `${currentSubdomain}.${FRP_SERVER_BASE_DOMAIN} (pour STCP/XTCP, configuration serveur spécifique requise)`
    : `(Configurez type et accès)`;


  async function onSubmit(values: FrpServiceInput) {
    setIsLoading(true);
    try {
      const payload = {
        ...values,
        localPort: Number(values.localPort),
        remotePort: (values.frpType === 'tcp' || values.frpType === 'udp') ? Number(values.remotePort) : undefined,
        useEncryption: values.useEncryption,
        useCompression: values.useCompression,
      };

      const response = await fetch('/api/dashboard/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        toast({ title: "Service Registered", description: `Service "${values.name}" for tunnel created successfully.` });
        router.push("/dashboard");
      } else {
        toast({ title: "Registration Failed", description: data.error || "Could not register service.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Registration Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                    value={field.value === undefined || field.value === null ? '' : String(field.value)}
                    onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  />
                </FormControl>
                <FormDescription>Le port sur lequel votre service tourne localement (ex: `80`, `3000`, `25565`).</FormDescription>
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        value={field.value === undefined || field.value === null ? '' : String(field.value)}
                        onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
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
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="advanced-settings">
            <AccordionTrigger onClick={() => setShowAdvanced(!showAdvanced)} className="text-sm font-medium">
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
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel htmlFor="useEncryption">
                        Activer l&apos;Encryption
                      </FormLabel>
                      <FormDescription>
                        Chiffre les données entre le client et le serveur Panda Tunnels (recommandé).
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
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel htmlFor="useCompression">
                        Activer la Compression
                      </FormLabel>
                      <FormDescription>
                        Compresse les données. Peut améliorer la vitesse sur des connexions lentes mais augmente l&apos;usage CPU.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>


        <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Settings2 className="mr-2 h-4 w-4" />
          Enregistrer le Service Tunnel
        </Button>
      </form>
    </Form>
  );
}


    