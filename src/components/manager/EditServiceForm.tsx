
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
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, AlertTriangleIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";


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
      localPort: '' as any, // Initialize with empty string, will be parsed
      subdomain: "",
      frpType: "http", // Default frpType
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
      .then((data: FrpServiceInput) => {
        // Ensure localPort is treated as string for the form input if it's a number
        const localPortValue = data.localPort === undefined || data.localPort === null ? '' : String(data.localPort);
        form.reset({
            name: data.name || "",
            description: data.description || "",
            localPort: localPortValue as any, // Zod will parse it back to number on submit
            subdomain: data.subdomain || "",
            frpType: frpServiceTypes.includes(data.frpType) ? data.frpType : "http",
        });
      })
      .catch(err => {
        toast({ title: "Error Loading Service", description: err.message, variant: "destructive" });
        router.push("/dashboard"); // Redirect if service can't be loaded
      })
      .finally(() => setIsFetching(false));
  }, [serviceId, form, toast, router]);

  async function onSubmit(values: FrpServiceInput) {
    setIsLoading(true);
    try {
      const payload = {
        ...values,
        localPort: Number(values.localPort), // Ensure localPort is a number before sending
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
            description: `Service "${values.name}" tunnel configuration updated. You MUST get the new client config and restart your local frpc client.`,
            duration: 7000, // Longer duration for important message
        });
        router.push("/dashboard");
      } else {
        toast({ title: "Update Failed", description: data.error || "Could not update service. The subdomain might already be in use.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Update Error", description: "An unexpected error occurred during update.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  const currentSubdomain = form.watch("subdomain");
  const publicUrlPreview = currentSubdomain ? `${currentSubdomain}.${FRP_SERVER_BASE_DOMAIN}` : `your-subdomain.${FRP_SERVER_BASE_DOMAIN}`;


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
          <AlertTitle>Important: Applying Configuration Changes</AlertTitle>
          <AlertDescription>
            After saving changes here, PANDA&apos;s record of your service is updated.
            However, these changes are **not automatically applied** to your running <code className="font-mono bg-muted px-1 rounded">frpc</code> client.
            <br />You **must** go to the &quot;Get Config&quot; page for this service (from the dashboard), obtain the new <code className="font-mono bg-muted px-1 rounded">frpc.toml</code>, update your local file, and then **restart your <code className="font-mono bg-muted px-1 rounded">frpc.exe</code> client** for the new settings to take effect.
          </AlertDescription>
        </Alert>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Name (for PANDA & Tunnel ID)</FormLabel>
              <FormControl>
                <Input placeholder="MyGameServer" {...field} />
              </FormControl>
              <FormDescription>A unique name for your service. Used in tunnel configuration. Allowed: letters, numbers, hyphens, and underscores.</FormDescription>
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
                <Textarea placeholder="Brief description of your service (e.g., Minecraft Server, Personal Blog)." {...field} />
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
                <FormLabel>Local Port</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g., 3000 or 25565"
                    {...field}
                    // Value is managed as string by react-hook-form for type="number" when it can be empty
                    // Zod schema handles parsing to number
                    onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  />
                </FormControl>
                <FormDescription>The port your service runs on locally.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="frpType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tunnel Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a tunnel type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {frpServiceTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Protocol of your local service. For Minecraft (Java), use TCP and port 25565.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
            control={form.control}
            name="subdomain"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Desired Subdomain</FormLabel>
                <FormControl>
                  <Input placeholder="mycoolservice" {...field} />
                </FormControl>
                <FormDescription>
                  Your service will be accessible at <code className="bg-muted px-1 py-0.5 rounded">{publicUrlPreview}</code>.
                  Use lowercase letters, numbers, and hyphens. This is used for HTTP/HTTPS tunnel types and helps form the public URL.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        <Button type="submit" className="w-full sm:w-auto" disabled={isLoading || isFetching}>
          {(isLoading || isFetching) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Save Tunnel Changes
        </Button>
      </form>
    </Form>
  );
}
