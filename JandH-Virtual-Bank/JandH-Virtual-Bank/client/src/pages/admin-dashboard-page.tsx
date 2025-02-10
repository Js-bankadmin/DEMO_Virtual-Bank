import { MainNav } from "@/components/layout/main-nav";
import { UserNav } from "@/components/layout/user-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Users, ShieldCheck, UserX } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  if (!user?.isAdmin) {
    return <Redirect to="/" />;
  }

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const updateUserStatusMutation = useMutation({
    mutationFn: async ({
      userId,
      status,
    }: {
      userId: number;
      status: { isAdmin?: boolean; isActive?: boolean };
    }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}`, status);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Sucesso",
        description: "Status do usuário atualizado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <MainNav />
          <div className="ml-auto flex items-center space-x-4">
            <UserNav />
          </div>
        </div>
      </div>
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gerenciar Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted">
                  <tr>
                    <th className="px-6 py-3">Nome Completo</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Username</th>
                    <th className="px-6 py-3">Admin</th>
                    <th className="px-6 py-3">Ativo</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.map((u) => (
                    <tr key={u.id} className="border-b">
                      <td className="px-6 py-4">{u.fullName}</td>
                      <td className="px-6 py-4">{u.email}</td>
                      <td className="px-6 py-4">{u.username}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={u.isAdmin}
                            disabled={u.id === user?.id}
                            onCheckedChange={(checked) =>
                              updateUserStatusMutation.mutate({
                                userId: u.id,
                                status: { isAdmin: checked },
                              })
                            }
                          />
                          <ShieldCheck
                            className={`h-4 w-4 ${
                              u.isAdmin ? "text-primary" : "text-muted-foreground"
                            }`}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={u.isActive}
                            disabled={u.id === user?.id}
                            onCheckedChange={(checked) =>
                              updateUserStatusMutation.mutate({
                                userId: u.id,
                                status: { isActive: checked },
                              })
                            }
                          />
                          <UserX
                            className={`h-4 w-4 ${
                              !u.isActive
                                ? "text-destructive"
                                : "text-muted-foreground"
                            }`}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
