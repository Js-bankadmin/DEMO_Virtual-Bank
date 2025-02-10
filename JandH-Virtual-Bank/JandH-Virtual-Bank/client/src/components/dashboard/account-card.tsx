import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Wallet } from "lucide-react";

export function AccountCard() {
  const { user } = useAuth();

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Saldo Disponível</CardTitle>
        <Wallet className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-primary">
          R$ {parseFloat(user?.balance?.toString() || "0").toFixed(2)}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Atualizado em tempo real
        </p>
      </CardContent>
    </Card>
  );
}