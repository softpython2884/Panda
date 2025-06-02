
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
import { ServiceSchema, type ServiceInput } from "@/lib/schemas";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";

interface EditServiceFormProps {
  serviceId: string;
  initialData?: ServiceInput & { id: string }; // Optional initial data if pre-fetched
}

export default function EditServiceForm({ serviceId, initialData }: EditServiceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(!initialData); // Fetch if no initial data

  const form = useForm<ServiceInput>({
    resolver: zodResolver(ServiceSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      local_url: "http://localhost:",
      public_url: "",
      domain: "",
      type: "website",
    },
  });

  useEffect(() => {
    if (!initialData) {
      setIsFetching(true);
      fetch(`/api/manager/service/${serviceId}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch service details');
          return res.json();
        })
        .then(data => {
          form.reset(data); // Populate form with fetched data
          setIsFetching(false);
        })
        .catch(err => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
          setIsFetching(false);
          // router.push('/dashboard'); // Redirect if service can't be fetched
        });
    }
  }, [serviceId, initialData, form, toast, router]);

  async function onSubmit(values: ServiceInput) {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/manager/service/${serviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (response.ok) {
        toast({ title: "Service Updated", description: `Service "${values.name}" updated successfully.` });
        router.push("/dashboard"); // Or refresh current page
      } else {
        toast({ title: "Update Failed", description: data.error || "Could not update service.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Update Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

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
              <FormLabel>Service Name</FormLabel>
              <FormControl>
                <Input placeholder="My Awesome App" {...field} />
              </FormControl>
              <FormDescription>A short, descriptive name for your service.</FormDescription>
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
                <Textarea placeholder="Tell us more about your service..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <div className="grid md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="local_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Local URL</FormLabel>
                <FormControl>
                  <Input placeholder="http://localhost:3000" {...field} />
                </FormControl>
                <FormDescription>The URL where your service runs locally.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="public_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Public URL (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="https://your-tunnel.ngrok.io" {...field} />
                </FormControl>
                <FormDescription>The publicly accessible URL (e.g., from ngrok, playit).</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="domain"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Domain Name</FormLabel>
                <FormControl>
                  <Input placeholder="myapp.panda" {...field} />
                </FormControl>
                <FormDescription>Must end in .panda, .pinou, or .pika.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service Type</FormLabel>
                <FormControl>
                  <Input placeholder="website, api, game" {...field} />
                </FormControl>
                <FormDescription>Category of your service.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" className="w-full sm:w-auto" disabled={isLoading || isFetching}>
          {(isLoading || isFetching) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </form>
    </Form>
  );
}
