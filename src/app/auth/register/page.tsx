
import RegisterForm from "@/components/auth/RegisterForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">Create PANDA Account</CardTitle>
          <CardDescription>Join the PANDA Ecosystem and manage your services.</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
           <p className="mt-6 text-center text-sm">
            Already have an account?{" "}
            <Button variant="link" asChild className="p-0 h-auto">
              <Link href="/auth/login">
                Login here
              </Link>
            </Button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
