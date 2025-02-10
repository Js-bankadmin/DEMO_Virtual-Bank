import { MainNav } from "@/components/layout/main-nav";
import { UserNav } from "@/components/layout/user-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

type TransferFormData = {
  recipientUsername: string;
  amount: string;
  description: string;
};

export default function TransferPage() {
  const { toast } = useToast();
  const form = useForm<TransferFormData>({
    defaultValues: {
      recipientUsername: "",
      amount: "",
      description: "",
    },
  });

  const transferMutation = useMutation({
    mutationFn: async (data: TransferFormData) => {
      const res = await apiRequest("POST", "/api/transfer", {
        recipientUsername: data.recipientUsername,
        amount: parseFloat(data.amount),
        description: data.description,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Success",
        description: "Transfer completed successfully",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
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
        <div className="mx-auto max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Transfer Money</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={form.handleSubmit((data) => transferMutation.mutate(data))}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="recipientUsername">Recipient Username</Label>
                  <Input
                    id="recipientUsername"
                    {...form.register("recipientUsername")}
                    placeholder="Enter recipient's username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    {...form.register("amount")}
                    placeholder="Enter amount"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...form.register("description")}
                    placeholder="What's this transfer for?"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={transferMutation.isPending}
                >
                  Transfer
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
