
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
import { ServiceSchema, type FrpServiceInput, frpServiceTypes, FRP_SERVER_BASE_DOMAIN } from "@/lib/schemas"; // ServiceSchema is FrpServiceSchema
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Settings2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditServiceFormProps {
  serviceId: string;
}

export default function EditServiceForm({ serviceId }: EditServiceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true); 

  const form = useForm<FrpServiceInput>({
    resolver: zodResolver(ServiceSchema), // ServiceSchema is FrpServiceSchema
    defaultValues: {
      name: "",
      description: "",
      localPort: undefined,
      subdomain: "",
      frpType: "http",
    },
  });

  useEffect(() => {
    setIsFetching(true);
    fetch(`/api/manager/service/${serviceId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch service details');
        return res.json();
      })
      .then((data: FrpServiceInput) => { // Expecting FrpServiceInput structure from GET
        form.reset({
            name: data.name,
            description: data.description,
            localPort: data.localPort,
            subdomain: data.subdomain, // API returns 'subdomain' as 'subdomain'
            frpType: frpServiceTypes.includes(data.frpType) ? data.frpType : "http", // Ensure frpType is valid
        }); 
      })
      .catch(err => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
        router.push("/dashboard"); // Redirect if service can't be loaded
      })
      .finally(() => setIsFetching(false));
  }, [serviceId, form, toast, router]);

  async function onSubmit(values: FrpServiceInput) {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/manager/service/${serviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (response.ok) {
        toast({ title: "Service Updated", description: `Service "${values.name}" tunnel updated successfully.` });
        router.push("/dashboard"); 
      } else {
        toast({ title: "Update Failed", description: data.error || "Could not update service.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Update Error", description: "An unexpected error occurred.", variant: "destructive" });
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
        <p>Loading service details...</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Name (for PANDA & Tunnel ID)</FormLabel>
              <FormControl>
                <Input placeholder="MyGameServer" {...field} />
              </FormControl>
              <FormDescription>A unique name for your service. Used in tunnel configuration. Allowed: letters, numbers, -, _</FormDescription>
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
                    onChange={event => field.onChange(+event.target.value)}
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
                <Select onValueChange={field.onChange} value={field.value}>
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
                <FormDescription>Protocol of your local service.</FormDescription>
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
                  Use lowercase letters, numbers, and hyphens.
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
