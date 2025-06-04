
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
import { Loader2, Save } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Mail } from "lucide-react";

export default function UserProfileForm() {
  const { user, fetchUser, isCheckingAuthSession } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  // isFetchingProfile will be true if isCheckingAuthSession is true OR if user is not yet populated
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
      // Auth check is done, but no user (e.g., not logged in or error fetching)
      setIsFetchingProfile(false);
    }
    // If isCheckingAuthSession is true, isFetchingProfile remains true
  }, [user, form, isCheckingAuthSession]);


  async function onSubmit(values: UserProfileUpdateInput) {
    setIsLoading(true);
    try {
      const payload: Partial<UserProfileUpdateInput> = {};
      if (values.username && values.username !== user?.username) payload.username = values.username;
      // Send empty strings as null for optional fields
      payload.firstName = values.firstName === "" ? null : values.firstName;
      payload.lastName = values.lastName === "" ? null : values.lastName;
      
      // Ensure we only send fields that actually changed or are being set
      if (payload.firstName === user?.firstName) delete payload.firstName;
      if (payload.lastName === user?.lastName) delete payload.lastName;


      if (Object.keys(payload).length === 0) {
        toast({ title: "No Changes", description: "You haven't made any changes to your profile." });
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
        toast({ title: "Profile Updated", description: "Your profile information has been saved." });
        await fetchUser(); // Refresh user context with updated data
      } else {
        toast({ title: "Update Failed", description: data.error || "Could not update profile.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Update Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }
  
  // Display loader if either the auth session is being checked OR if form data hasn't been reset yet
  if (isCheckingAuthSession || isFetchingProfile) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }
  
  if (!user) { // Auth check done, but no user
    return (
         <Alert variant="destructive">
            <Mail className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Could not load user profile. Please ensure you are logged in.</AlertDescription>
        </Alert>
    );
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-2">
            <FormLabel>Email</FormLabel>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md border">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{user?.email}</span>
            </div>
            <FormDescription>Your email address cannot be changed here.</FormDescription>
        </div>

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username (Pseudo)</FormLabel>
              <FormControl>
                <Input placeholder="YourUniqueUsername" {...field} />
              </FormControl>
              <FormDescription>This is your public display name. Must be unique.</FormDescription>
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
                <FormLabel>First Name</FormLabel>
                <FormControl>
                    <Input placeholder="Your first name (optional)" {...field} value={field.value ?? ''} />
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
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                    <Input placeholder="Your last name (optional)" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        
        <Button type="submit" className="w-full sm:w-auto" disabled={isLoading || !form.formState.isDirty}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </form>
    </Form>
  );
}
