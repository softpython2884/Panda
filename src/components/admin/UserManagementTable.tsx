
"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, Edit3, Check, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserRoleSchema, type UserRole } from "@/lib/schemas";
import { format } from "date-fns";
import { fr } from "date-fns/locale";


interface UserForAdmin {
  id: string;
  email: string;
  username: string | null;
  role: UserRole;
  created_at: string;
  firstName: string | null;
  lastName: string | null;
}

export default function UserManagementTable() {
  const [users, setUsers] = useState<UserForAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditRole = (userId: string, currentRole: UserRole) => {
    setEditingUserId(userId);
    setSelectedRole(currentRole);
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setSelectedRole(null);
  };

  const handleSaveRole = async (userId: string) => {
    if (!selectedRole) return;
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to update role");
      }
      toast({ title: "Success", description: "User role updated successfully." });
      fetchUsers(); // Refresh the list
      handleCancelEdit();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Loading users...</p>
      </div>
    );
  }

  if (users.length === 0) {
    return <p className="text-muted-foreground">No users found.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Username</TableHead>
          <TableHead>Prénom</TableHead>
          <TableHead>Nom</TableHead>
          <TableHead>Rôle</TableHead>
          <TableHead>Créé le</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.username || "-"}</TableCell>
            <TableCell>{user.firstName || "-"}</TableCell>
            <TableCell>{user.lastName || "-"}</TableCell>
            <TableCell>
              {editingUserId === user.id ? (
                <Select
                  value={selectedRole || user.role}
                  onValueChange={(value) => setSelectedRole(value as UserRole)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {UserRoleSchema.options.map((roleValue) => (
                      <SelectItem key={roleValue} value={roleValue}>
                        {roleValue}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                user.role
              )}
            </TableCell>
            <TableCell>{format(new Date(user.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}</TableCell>
            <TableCell>
              {editingUserId === user.id ? (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleSaveRole(user.id)} variant="default">
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={handleCancelEdit} variant="ghost">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button size="sm" onClick={() => handleEditRole(user.id, user.role)} variant="outline">
                  <Edit3 className="h-4 w-4 mr-1" /> Modifier Rôle
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
