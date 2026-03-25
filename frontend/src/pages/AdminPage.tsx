import { useState } from "react";
import {
  Users,
  Flag,
  BarChart3,
  HelpCircle,
  ScrollText,
  ShieldAlert,
} from "lucide-react";
import { useModerationAlerts } from "@/hooks/useAdmin";
import { useAuth } from "@/context/useAuth";
import StatsTab from "@/features/admin/StatsTab";
import UsersTab from "@/features/admin/UsersTab";
import QuestionsTab from "@/features/admin/QuestionsTab";
import ReportsTab from "@/features/admin/ReportsTab";
import AlertsTab from "@/features/admin/AlertsTab";
import AuditLogTab from "@/features/admin/AuditLogTab";

type Tab = "stats" | "users" | "questions" | "reports" | "alerts" | "audit";

export default function AdminPage() {
  const { user: me } = useAuth();
  const isAdmin = me?.role === "admin";

  const [tab, setTab] = useState<Tab>("stats");
  const { data: alertsData } = useModerationAlerts();
  const unreadAlertCount = alertsData?.filter((a) => !a.is_read).length ?? 0;

  const allTabs: {
    key: Tab;
    label: string;
    icon: React.ReactNode;
    adminOnly?: boolean;
  }[] = [
    { key: "stats", label: "Stats", icon: <BarChart3 className="h-4 w-4" /> },
    { key: "users", label: "Users", icon: <Users className="h-4 w-4" /> },
    {
      key: "questions",
      label: "Questions",
      icon: <HelpCircle className="h-4 w-4" />,
    },
    { key: "reports", label: "Reports", icon: <Flag className="h-4 w-4" /> },
    {
      key: "alerts",
      label: "Alerts",
      icon: (
        <span className="relative">
          <ShieldAlert className="h-4 w-4" />
          {unreadAlertCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white leading-none">
              {unreadAlertCount > 9 ? "9+" : unreadAlertCount}
            </span>
          )}
        </span>
      ),
    },
    {
      key: "audit",
      label: "Audit Log",
      icon: <ScrollText className="h-4 w-4" />,
      adminOnly: true,
    },
  ];
  const tabs = allTabs.filter((t) => (t.adminOnly ? isAdmin : true));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Admin Panel</h1>

      <div className="mb-6 flex gap-1 rounded-lg border border-border bg-card p-1 w-fit flex-wrap">
        {tabs.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {tab === "stats" && <StatsTab />}
      {tab === "users" && <UsersTab isAdmin={isAdmin} />}
      {tab === "questions" && <QuestionsTab />}
      {tab === "reports" && <ReportsTab />}
      {tab === "alerts" && (
        <AlertsTab onViewReports={() => setTab("reports")} />
      )}
      {tab === "audit" && isAdmin && <AuditLogTab />}
    </div>
  );
}
