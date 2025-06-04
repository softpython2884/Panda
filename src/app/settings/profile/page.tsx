
import UserProfileForm from "@/components/settings/UserProfileForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfileSettingsPage() {
  return (
    <Card className="shadow-lg max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">User Profile</CardTitle>
        <CardDescription>Manage your personal information and account details.</CardDescription>
      </CardHeader>
      <CardContent>
        <UserProfileForm />
      </CardContent>
    </Card>
  );
}
