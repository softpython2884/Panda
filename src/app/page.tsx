
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Search, LogIn, UserPlus, PawPrint } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
      <PawPrint className="h-24 w-24 mb-6 text-primary" />
      <h1 className="text-5xl font-headline font-bold mb-4 text-primary">
        Welcome to the PANDA Ecosystem
      </h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-3xl">
        PANDA simplifies sharing and hosting by securely opening your localhost to the world. Publish services, manage shared storage, run scripts, integrate Git, use webmail, and more—making web development and sharing easier than ever.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 w-full max-w-4xl">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Search className="text-accent h-6 w-6" />Discover Services</CardTitle>
            <CardDescription>Explore a wide range of services registered on the PANDA network.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full bg-[#a259e4] hover:bg-[#8a48c4] text-white">
              <Link href="/search">Go to PANDA Search <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><UserPlus className="text-primary h-6 w-6" />Join the Ecosystem</CardTitle>
            <CardDescription>Create an account to register and manage your own services.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/auth/register">Sign Up Now <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><LogIn className="text-secondary-foreground h-6 w-6" />Access Your Dashboard</CardTitle>
            <CardDescription>Already a member? Log in to manage your services and profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="w-full">
              <Link href="/auth/login">Log In <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground mt-8">
        PANDA Ecosystem: Secure. Connected. Simplified.
      </p>
    </div>
  );
}
