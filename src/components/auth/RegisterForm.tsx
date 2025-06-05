
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UserRegistrationSchema, type UserRegistrationInput } from "@/lib/schemas";
// import { useAuth } from "@/contexts/AuthContext"; // Not using login from context here
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function RegisterForm() {
  // const { register, login } = useAuth(); // Not logging in immediately after register anymore
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState<string | null>(null);


  const formSchema = UserRegistrationSchema.extend({
    confirmPassword: z.string().min(1, "Please confirm your password"),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

  type RegisterFormInputExtended = z.infer<typeof formSchema>;

  const form = useForm<RegisterFormInputExtended>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: RegisterFormInputExtended) {
    setIsLoading(true);
    setRegistrationMessage(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: values.username, email: values.email, password: values.password }),
      });
      const data = await res.json();

      if (res.ok) {
        toast({ 
            title: "Registration Submitted", 
            description: "Please check your email to verify your account before logging in.",
            duration: 10000, // Longer duration for this important message
        });
        setRegistrationMessage(data.message || "Registration successful. Please check your email to verify your account.");
        form.reset(); // Clear form on success
        // router.push("/auth/login?message=verification_sent"); // Optionally redirect or show message here
      } else {
        toast({ title: "Registration Failed", description: data.error || "Could not register user.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Registration Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {registrationMessage && (
          <Alert variant="default" className="bg-green-50 border-green-300 text-green-700">
            <MailCheck className="h-5 w-5 text-green-600" />
            <AlertTitle className="font-semibold">Registration Successful!</AlertTitle>
            <AlertDescription>
              {registrationMessage} You can now close this page or proceed to login once verified.
            </AlertDescription>
          </Alert>
        )}
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username (Pseudo)</FormLabel>
              <FormControl>
                <Input placeholder="YourUniqueUsername" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                 <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading || !!registrationMessage}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {registrationMessage ? "Verification Email Sent" : "Register"}
        </Button>
      </form>
    </Form>
  );
}
