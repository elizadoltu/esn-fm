import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Flag,
  BarChart3,
  HelpCircle,
  ScrollText,
  ShieldAlert,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { useModerationAlerts } from "@/hooks/useAdmin";
import { useAuth } from "@/context/useAuth";
import StatsTab from "@/features/admin/StatsTab";
import UsersTab from "@/features/admin/UsersTab";
import QuestionsTab from "@/features/admin/QuestionsTab";
import ReportsTab from "@/features/admin/ReportsTab";
import AlertsTab from "@/features/admin/AlertsTab";
import AuditLogTab from "@/features/admin/AuditLogTab";
import DailyQAdminTab from "@/features/admin/DailyQAdminTab";

type Tab =
  | "stats"
  | "users"
  | "questions"
  | "reports"
  | "alerts"
  | "audit"
  | "dailyq";

export default function AdminPage() {
  const { user: me } = useAuth();
  const isAdmin = me?.role === "admin";

  const [tab, setTab] = useState<Tab>("stats");
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: alertsData } = useModerationAlerts();
  const unreadAlertCount = alertsData?.filter((a) => !a.is_read).length ?? 0;

  const allTabs: {
    key: Tab;
    label: string;
    icon: React.ReactNode;
    adminOnly?: boolean;
    badge?: number;
  }[] = [
    { key: "stats", label: "Stats", icon: <BarChart3 className="h-4 w-4" /> },
    { key: "users", label: "Users", icon: <Users className="h-4 w-4" /> },
    {
      key: "questions",
      label: "Questions",
      icon: <HelpCircle className="h-4 w-4" />,
    },
    {
      key: "reports",
      label: "Reports",
      icon: <Flag className="h-4 w-4" />,
    },
    {
      key: "alerts",
      label: "Alerts",
      icon: <ShieldAlert className="h-4 w-4" />,
      badge: unreadAlertCount,
    },
    {
      key: "audit",
      label: "Audit Log",
      icon: <ScrollText className="h-4 w-4" />,
      adminOnly: true,
    },
    {
      key: "dailyq",
      label: "Daily Q",
      icon: <Sparkles className="h-4 w-4" />,
      adminOnly: true,
    },
  ];
  const tabs = allTabs.filter((t) => (t.adminOnly ? isAdmin : true));
  const activeTab = tabs.find((t) => t.key === tab)!;

  function selectTab(key: Tab) {
    setTab(key);
    setMenuOpen(false);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm">
        <Link
          to="/home"
          className="text-muted-foreground hover:text-foreground"
        >
          Home
        </Link>
        <span className="text-muted-foreground">/</span>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => selectTab("stats")}
        >
          Admin
        </button>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium text-foreground">{activeTab.label}</span>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage users, content, and platform settings
          </p>
        </div>
        {unreadAlertCount > 0 && (
          <button
            onClick={() => selectTab("alerts")}
            className="flex shrink-0 items-center gap-2 rounded-full bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20 transition-colors"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            {unreadAlertCount} unread{" "}
            {unreadAlertCount === 1 ? "alert" : "alerts"}
          </button>
        )}
      </div>

      {/* Mobile: dropdown menu */}
      <div className="relative mb-6 sm:hidden">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium shadow-sm"
        >
          <span className="flex items-center gap-2">
            {activeTab.icon}
            {activeTab.label}
            {activeTab.badge != null && activeTab.badge > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white leading-none">
                {activeTab.badge > 9 ? "9+" : activeTab.badge}
              </span>
            )}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${menuOpen ? "rotate-180" : ""}`}
          />
        </button>

        {menuOpen && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
            {tabs.map(({ key, label, icon, badge }) => (
              <button
                key={key}
                onClick={() => selectTab(key)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  tab === key
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-foreground hover:bg-accent"
                }`}
              >
                {icon}
                {label}
                {badge != null && badge > 0 && (
                  <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white leading-none">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: pill tab bar */}
      <div className="mb-6 hidden sm:block">
        <div className="flex gap-1 rounded-xl border border-border bg-muted/40 p-1">
          {tabs.map(({ key, label, icon, badge }) => (
            <button
              key={key}
              onClick={() => selectTab(key)}
              className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                tab === key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {icon}
              {label}
              {badge != null && badge > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white leading-none">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div>
        {tab === "stats" && <StatsTab />}
        {tab === "users" && <UsersTab isAdmin={isAdmin} />}
        {tab === "questions" && <QuestionsTab />}
        {tab === "reports" && <ReportsTab />}
        {tab === "alerts" && (
          <AlertsTab onViewReports={() => selectTab("reports")} />
        )}
        {tab === "audit" && isAdmin && <AuditLogTab />}
        {tab === "dailyq" && isAdmin && <DailyQAdminTab />}
      </div>
    </div>
  );
}
