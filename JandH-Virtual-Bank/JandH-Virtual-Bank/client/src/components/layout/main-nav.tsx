import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  Home,
  Upload,
  SendHorizontal,
  Receipt,
  User,
  CreditCard,
  Shield,
  Users
} from "lucide-react";

export function MainNav() {
  const [location] = useLocation();
  const { user } = useAuth();

  const items = [
    { href: "/", label: "Início", icon: Home },
    { href: "/deposit", label: "Depositar", icon: Upload },
    { href: "/transfer", label: "Transferir", icon: SendHorizontal },
    { href: "/bills", label: "Contas", icon: Receipt },
    { href: "/virtual-cards", label: "Cartões", icon: CreditCard },
    { href: "/security", label: "Segurança", icon: Shield },
    { href: "/profile", label: "Perfil", icon: User },
    // Show admin link only for admin users
    ...(user?.isAdmin ? [{ href: "/admin", label: "Administração", icon: Users }] : []),
  ];

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {items.map(({ href, label, icon: Icon }) => {
        const isActive = location === href;
        return (
          <Link key={href} href={href}>
            <a
              className={cn(
                "flex items-center text-sm font-medium transition-colors hover:text-primary",
                isActive ? "text-primary" : "text-muted-foreground",
                "relative group"
              )}
            >
              <Icon className="h-4 w-4 mr-2 transition-transform group-hover:scale-110" />
              {label}
              {isActive && (
                <span className="absolute -bottom-4 left-0 right-0 h-0.5 bg-primary" />
              )}
            </a>
          </Link>
        );
      })}
    </nav>
  );
}