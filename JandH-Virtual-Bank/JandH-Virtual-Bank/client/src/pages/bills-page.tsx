import { MainNav } from "@/components/layout/main-nav";
import { UserNav } from "@/components/layout/user-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

const BILL_TYPES = [
  { value: "electricity", label: "Electricity" },
  { value: "water", label: "Water" },
  { value: "internet", label: "Internet" },
  { value: "phone", label: "Phone" },
  { value: "cable", label: "Cable TV" },
];

type BillPaymentFormData = {
  billType: string;
  amount: string;
};

export default function BillsPage() {
  const { toast } = useToast();
  const form = useForm<BillPaymentFormData>({
    defaultValues: {
      billType: "",
      amount: "",
    },
  });

  const billPaymentMutation = useMutation({
    mutationFn: async (data: BillPaymentFormData) => {
      const res = await apiRequest("POST", "/api/bill-payment", {
        billType: data.billType,
        amount: parseFloat(data.amount),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Success",
        description: "Bill payment completed successfully",
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
              <CardTitle>Pay Bills</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={form.handleSubmit((data) => billPaymentMutation.mutate(data))}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="billType">Bill Type</Label>
                  <Controller
                    control={form.control}
                    name="billType"
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a bill type" />
                        </SelectTrigger>
                        <SelectContent>
                          {BILL_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
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
                <Button
                  type="submit"
                  className="w-full"
                  disabled={billPaymentMutation.isPending}
                >
                  Pay Bill
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
