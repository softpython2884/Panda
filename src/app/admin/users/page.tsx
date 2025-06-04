
import UserManagementTable from "@/components/admin/UserManagementTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline">User Management</CardTitle>
          <CardDescription>View, edit roles, and manage users in the PANDA system.</CardDescription>
        </CardHeader>
        <CardContent>
          <UserManagementTable />
        </CardContent>
      </Card>
    </div>
  );
}
