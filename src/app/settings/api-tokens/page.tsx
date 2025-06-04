
import ApiTokensManager from "@/components/settings/ApiTokensManager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ApiTokensPage() {
  return (
    <Card className="shadow-lg max-w-3xl">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Mes Tokens d&apos;API</CardTitle>
        <CardDescription>
          Gérez vos tokens d&apos;accès personnels. Ces tokens permettent à des applications tierces
          d&apos;accéder à votre compte PANDA en votre nom. Traitez-les comme des mots de passe !
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ApiTokensManager />
      </CardContent>
    </Card>
  );
}
