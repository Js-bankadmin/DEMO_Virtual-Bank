import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Transaction } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowDownUp, Loader2 } from "lucide-react";

export function RecentTransactions() {
  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowDownUp className="h-5 w-5" />
          Transações Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
          </div>
        ) : transactions?.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhuma transação encontrada
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions?.slice(0, 5).map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {format(new Date(transaction.createdAt), "dd 'de' MMMM", { locale: ptBR })}
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell className={`text-right font-medium ${
                    parseFloat(transaction.amount) < 0 ? 'text-red-500' : 'text-green-500'
                  }`}>
                    R$ {Math.abs(parseFloat(transaction.amount)).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}