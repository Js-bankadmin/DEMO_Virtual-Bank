import { MainNav } from "@/components/layout/main-nav";
import { UserNav } from "@/components/layout/user-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { VirtualCard, InsertVirtualCard } from "@shared/schema";
import { PlusCircle, CreditCard, LockKeyhole, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type NewCardFormData = {
  cardName: string;
  limit: string;
  expirationDate: string;
};

export default function VirtualCardsPage() {
  const { toast } = useToast();
  const [showCardDetails, setShowCardDetails] = useState<Record<number, boolean>>({});

  const { data: cards, isLoading } = useQuery<VirtualCard[]>({
    queryKey: ["/api/virtual-cards"],
  });

  const form = useForm<NewCardFormData>({
    defaultValues: {
      cardName: "",
      limit: "",
      expirationDate: "",
    },
  });

  const createCardMutation = useMutation({
    mutationFn: async (data: NewCardFormData) => {
      const res = await apiRequest("POST", "/api/virtual-cards", {
        cardName: data.cardName,
        cardLimit: parseFloat(data.limit),
        expirationDate: new Date(data.expirationDate).toISOString(),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/virtual-cards"] });
      toast({
        title: "Sucesso",
        description: "Cartão virtual criado com sucesso",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleCardStatusMutation = useMutation({
    mutationFn: async ({ cardId, isActive }: { cardId: number; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/virtual-cards/${cardId}/status`, {
        isActive,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/virtual-cards"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleCardDetails = (cardId: number) => {
    setShowCardDetails((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

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
      <div className="container py-10 space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Cartões Virtuais</h2>
          <Button
            onClick={() => {
              const dialog = document.getElementById("new-card-dialog");
              if (dialog instanceof HTMLDialogElement) {
                dialog.showModal();
              }
            }}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Novo Cartão
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {cards?.map((card) => (
            <Card key={card.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.cardName}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleCardDetails(card.id)}
                  >
                    {showCardDetails[card.id] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      toggleCardStatusMutation.mutate({
                        cardId: card.id,
                        isActive: !card.isActive,
                      })
                    }
                  >
                    <LockKeyhole
                      className={`h-4 w-4 ${
                        card.isActive ? "text-green-500" : "text-red-500"
                      }`}
                    />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Número do Cartão
                    </span>
                    <span className="font-medium">
                      {showCardDetails[card.id]
                        ? `**** **** **** ${card.lastFourDigits}`
                        : "•••• •••• •••• " + card.lastFourDigits}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">CVV</span>
                    <span className="font-medium">
                      {showCardDetails[card.id] ? card.cvv : "•••"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Data de Expiração
                    </span>
                    <span className="font-medium">
                      {format(new Date(card.expirationDate), "MM/yyyy")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Limite</span>
                    <span className="font-medium">
                      R$ {parseFloat(card.cardLimit.toString()).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span
                      className={`font-medium ${
                        card.isActive ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {card.isActive ? "Ativo" : "Bloqueado"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <dialog
          id="new-card-dialog"
          className="modal p-8 rounded-lg shadow-lg backdrop:bg-black backdrop:bg-opacity-50"
        >
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Novo Cartão Virtual</h3>
            <form
              onSubmit={form.handleSubmit((data) => {
                createCardMutation.mutate(data);
                const dialog = document.getElementById("new-card-dialog");
                if (dialog instanceof HTMLDialogElement) {
                  dialog.close();
                }
              })}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="cardName">Nome do Cartão</Label>
                <Input
                  id="cardName"
                  {...form.register("cardName")}
                  placeholder="Ex: Compras Online"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="limit">Limite</Label>
                <Input
                  id="limit"
                  type="number"
                  step="0.01"
                  min="0"
                  {...form.register("limit")}
                  placeholder="Digite o limite"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expirationDate">Data de Expiração</Label>
                <Input
                  id="expirationDate"
                  type="date"
                  {...form.register("expirationDate")}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const dialog = document.getElementById("new-card-dialog");
                    if (dialog instanceof HTMLDialogElement) {
                      dialog.close();
                    }
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createCardMutation.isPending}
                >
                  {createCardMutation.isPending ? "Criando..." : "Criar Cartão"}
                </Button>
              </div>
            </form>
          </div>
        </dialog>
      </div>
    </div>
  );
}