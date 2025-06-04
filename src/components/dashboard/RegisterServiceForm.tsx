
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
import { Loader2, Settings2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RegisterServiceForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FrpServiceInput>({
    resolver: zodResolver(ServiceSchema),
    defaultValues: {
      name: "",
      description: "",
      localPort: '' as any, // Initialize with empty string for controlled input, will be parsed to number
      subdomain: "",
      frpType: "http",
    },
  });

  async function onSubmit(values: FrpServiceInput) {
    setIsLoading(true);
    try {
      // Ensure localPort is a number before sending
      const payload = {
        ...values,
        localPort: Number(values.localPort),
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

  const currentSubdomain = form.watch("subdomain");
  const publicUrlPreview = currentSubdomain ? `${currentSubdomain}.${FRP_SERVER_BASE_DOMAIN}` : `your-subdomain.${FRP_SERVER_BASE_DOMAIN}`;


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
                    // onChange in Zod schema handles parsing to number
                    // Value should be string for controlled input if it can be empty, or number if always number
                    value={field.value === undefined || field.value === null ? '' : String(field.value)}
                    onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  />
                </FormControl>
                <FormDescription>The port your service runs on locally (e.g., `80`, `3000`, `25565`).</FormDescription>
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <FormDescription>Protocol of your local service. For Minecraft, use TCP and port 25565.</FormDescription>
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
                  Use lowercase letters, numbers, and hyphens. This is used for HTTP/HTTPS and informative for other types.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

        <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Settings2 className="mr-2 h-4 w-4" />
          Register Tunnel Service
        </Button>
      </form>
    </Form>
  );
}
