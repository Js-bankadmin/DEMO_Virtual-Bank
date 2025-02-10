import { MainNav } from "@/components/layout/main-nav";
import { UserNav } from "@/components/layout/user-nav";
import { AccountCard } from "@/components/dashboard/account-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";

export default function DashboardPage() {
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
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="grid gap-4">
          <AccountCard />
          <QuickActions />
          <RecentTransactions />
        </div>
      </div>
    </div>
  );
}
