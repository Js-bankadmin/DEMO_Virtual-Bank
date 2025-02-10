import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, SendHorizontal, Receipt, ArrowUpDown } from "lucide-react";

const actions = [
  { href: "/deposit", label: "Depositar", icon: PlusCircle, color: "text-green-500" },
  { href: "/transfer", label: "Transferir", icon: SendHorizontal, color: "text-blue-500" },
  { href: "/bills", label: "Pagar Contas", icon: Receipt, color: "text-purple-500" },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUpDown className="h-5 w-5" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        {actions.map(({ href, label, icon: Icon, color }) => (
          <Link key={href} href={href}>
            <Button
              variant="outline"
              className="w-full h-24 relative overflow-hidden transition-all hover:border-primary/50 hover:bg-primary/5"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-background to-background/80" />
              <div className="relative flex flex-col items-center gap-2">
                <Icon className={`h-6 w-6 ${color}`} />
                <span className="font-medium">{label}</span>
              </div>
            </Button>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}