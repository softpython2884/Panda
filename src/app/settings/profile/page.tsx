
import UserProfileForm from "@/components/settings/UserProfileForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfileSettingsPage() {
  return (
    <Card className="shadow-lg max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Mon Profil Utilisateur</CardTitle>
        <CardDescription>Gérez vos informations personnelles et les détails de votre compte PANDA.</CardDescription>
      </CardHeader>
      <CardContent>
        <UserProfileForm />
      </CardContent>
    </Card>
  );
}
