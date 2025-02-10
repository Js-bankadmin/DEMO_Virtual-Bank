import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-[90%] max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Página não encontrada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Desculpe, a página que você está procurando não existe.
          </p>
          <div className="flex justify-center">
            <Link href="/">
              <Button>Voltar para o início</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}