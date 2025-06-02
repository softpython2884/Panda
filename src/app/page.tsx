
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Search, LogIn, UserPlus, PawPrint } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
      <PawPrint className="h-24 w-24 mb-6 text-primary" />
      <h1 className="text-5xl font-headline font-bold mb-4 text-primary">
        Bienvenue dans l'Écosystème PANDA
      </h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-3xl">
        PANDA facilite le partage et l'hébergement en vous permettant d'ouvrir votre localhost au monde en toute sécurité. Publiez et référencez vos services locaux, gérez des stockages partagés, exécutez des scripts, intégrez vos Git, utilisez un webmail et bien plus. Avec PANDA, le développement et le partage sur le web n'ont jamais été aussi simples.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 w-full max-w-4xl">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Search className="text-accent h-6 w-6" />Découvrir des Services</CardTitle>
            <CardDescription>Explorez un large éventail de services enregistrés sur le réseau PANDA.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full bg-[#a259e4] hover:bg-[#8a48c4] text-white">
              <Link href="/search">Aller à PANDA Search <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><UserPlus className="text-primary h-6 w-6" />Rejoindre l'Écosystème</CardTitle>
            <CardDescription>Créez un compte pour enregistrer et gérer vos propres services.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/auth/register">S'inscrire Maintenant <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><LogIn className="text-secondary-foreground h-6 w-6" />Accéder à votre Tableau de Bord</CardTitle>
            <CardDescription>Déjà membre ? Connectez-vous pour gérer vos services et votre profil.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="w-full">
              <Link href="/auth/login">Se Connecter <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground mt-8">
        Écosystème PANDA : Sécurisé. Connecté. Simplifié.
      </p>
    </div>
  );
}
