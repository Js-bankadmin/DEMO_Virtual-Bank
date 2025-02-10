import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import DepositPage from "@/pages/deposit-page";
import TransferPage from "@/pages/transfer-page";
import BillsPage from "@/pages/bills-page";
import ProfilePage from "@/pages/profile-page";
import VirtualCardsPage from "@/pages/virtual-cards-page";
import SecuritySettingsPage from "@/pages/security-settings-page";
import AdminDashboardPage from "@/pages/admin-dashboard-page";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Switch>
          <Route path="/auth" component={AuthPage} />
          <Route path="/" component={() => <ProtectedRoute path="/" component={DashboardPage} />} />
          <Route path="/deposit" component={() => <ProtectedRoute path="/deposit" component={DepositPage} />} />
          <Route path="/transfer" component={() => <ProtectedRoute path="/transfer" component={TransferPage} />} />
          <Route path="/bills" component={() => <ProtectedRoute path="/bills" component={BillsPage} />} />
          <Route path="/profile" component={() => <ProtectedRoute path="/profile" component={ProfilePage} />} />
          <Route path="/virtual-cards" component={() => <ProtectedRoute path="/virtual-cards" component={VirtualCardsPage} />} />
          <Route path="/security" component={() => <ProtectedRoute path="/security" component={SecuritySettingsPage} />} />
          <Route path="/admin" component={() => <ProtectedRoute path="/admin" component={AdminDashboardPage} />} />
          <Route component={NotFound} />
        </Switch>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}