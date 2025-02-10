import { MainNav } from "@/components/layout/main-nav";
import { UserNav } from "@/components/layout/user-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Shield, Smartphone, QrCode } from "lucide-react";
import { useState } from "react";

type SetupFormData = {
  token: string;
};

type RecoveryFormData = {
  recoveryKey: string;
};

export default function SecuritySettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [qrCode, setQrCode] = useState<string>();
  const [recoveryKeys, setRecoveryKeys] = useState<string[]>();
  const [showRecoveryForm, setShowRecoveryForm] = useState(false);

  const setupForm = useForm<SetupFormData>({
    defaultValues: {
      token: "",
    },
  });

  const recoveryForm = useForm<RecoveryFormData>({
    defaultValues: {
      recoveryKey: "",
    },
  });

  const setup2FAMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/2fa/setup");
      return res.json();
    },
    onSuccess: (data) => {
      setQrCode(data.qrCodeUrl);
      setRecoveryKeys(data.recoveryKeys);
      toast({
        title: "2FA Setup",
        description: "Scan the QR code with your authenticator app",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const verify2FAMutation = useMutation({
    mutationFn: async (data: SetupFormData) => {
      const res = await apiRequest("POST", "/api/2fa/verify", data);
      return res.json();
    },
    onSuccess: () => {
      setQrCode(undefined);
      setRecoveryKeys(undefined);
      toast({
        title: "Success",
        description: "2FA enabled successfully",
      });
      setupForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const disable2FAMutation = useMutation({
    mutationFn: async (data: SetupFormData) => {
      const res = await apiRequest("POST", "/api/2fa/disable", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "2FA disabled successfully",
      });
      setupForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const recover2FAMutation = useMutation({
    mutationFn: async (data: RecoveryFormData) => {
      const res = await apiRequest("POST", "/api/2fa/recover", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "2FA disabled successfully using recovery key",
      });
      recoveryForm.reset();
      setShowRecoveryForm(false);
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
        <div className="mx-auto max-w-md space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Autenticação em Dois Fatores (2FA)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user?.twoFactorEnabled ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    2FA está ativado para sua conta. Para desativar, insira um código de verificação.
                  </p>
                  <form
                    onSubmit={setupForm.handleSubmit((data) => disable2FAMutation.mutate(data))}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="token">Código de Verificação</Label>
                      <Input
                        id="token"
                        {...setupForm.register("token")}
                        placeholder="Digite o código"
                      />
                    </div>
                    <div className="space-y-2">
                      <Button
                        type="submit"
                        variant="destructive"
                        className="w-full"
                        disabled={disable2FAMutation.isPending}
                      >
                        Desativar 2FA
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full"
                        onClick={() => setShowRecoveryForm(true)}
                      >
                        Usar Chave de Recuperação
                      </Button>
                    </div>
                  </form>

                  {showRecoveryForm && (
                    <form
                      onSubmit={recoveryForm.handleSubmit((data) => recover2FAMutation.mutate(data))}
                      className="space-y-4 border-t pt-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="recoveryKey">Chave de Recuperação</Label>
                        <Input
                          id="recoveryKey"
                          {...recoveryForm.register("recoveryKey")}
                          placeholder="Digite a chave de recuperação"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={recover2FAMutation.isPending}
                      >
                        Recuperar Acesso
                      </Button>
                    </form>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {!qrCode ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Ative a autenticação em dois fatores para adicionar uma camada extra de segurança à sua conta.
                      </p>
                      <Button
                        onClick={() => setup2FAMutation.mutate()}
                        className="w-full"
                        disabled={setup2FAMutation.isPending}
                      >
                        <Smartphone className="mr-2 h-4 w-4" />
                        Configurar 2FA
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>QR Code</Label>
                        <div className="flex justify-center p-4 bg-white rounded-lg">
                          <img src={qrCode} alt="QR Code for 2FA" className="w-48 h-48" />
                        </div>
                      </div>

                      {recoveryKeys && (
                        <div className="space-y-2">
                          <Label>Chaves de Recuperação</Label>
                          <div className="p-4 bg-muted rounded-lg space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Guarde estas chaves em um local seguro. Você precisará delas se perder acesso ao seu aplicativo autenticador.
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {recoveryKeys.map((key) => (
                                <code key={key} className="p-2 bg-background rounded text-xs">
                                  {key}
                                </code>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      <form
                        onSubmit={setupForm.handleSubmit((data) => verify2FAMutation.mutate(data))}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="token">Código de Verificação</Label>
                          <Input
                            id="token"
                            {...setupForm.register("token")}
                            placeholder="Digite o código"
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={verify2FAMutation.isPending}
                        >
                          <QrCode className="mr-2 h-4 w-4" />
                          Verificar e Ativar
                        </Button>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
