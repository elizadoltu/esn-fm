import { useState } from "react";
import { Users, Flag, BarChart3, Search } from "lucide-react";
import {
  useAdminStats,
  useAdminUsers,
  useUpdateUserRole,
  useAdminReports,
  useActionReport,
} from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

type Tab = "stats" | "users" | "reports";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("stats");
  const [userSearch, setUserSearch] = useState("");
  const [reportStatus, setReportStatus] = useState("pending");
  const [userOffset, setUserOffset] = useState(0);
  const [reportOffset, setReportOffset] = useState(0);

  const { data: stats, isLoading: statsLoading, error: statsError } = useAdminStats();
  const { data: usersData, isLoading: usersLoading, error: usersError } = useAdminUsers({
    q: userSearch || undefined,
    offset: userOffset,
  });
  const { data: reportsData, isLoading: reportsLoading, error: reportsError } = useAdminReports({
    status: reportStatus,
    offset: reportOffset,
  });
  const updateRole = useUpdateUserRole();
  const actionReport = useActionReport();

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "stats", label: "Stats", icon: <BarChart3 className="h-4 w-4" /> },
    { key: "users", label: "Users", icon: <Users className="h-4 w-4" /> },
    { key: "reports", label: "Reports", icon: <Flag className="h-4 w-4" /> },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Admin Panel</h1>

      {/* Tab bar */}
      <div className="mb-6 flex gap-1 rounded-lg border border-border bg-card p-1 w-fit">
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

      {/* ── Stats ────────────────────────────────────────────────── */}
      {tab === "stats" && statsLoading && (
        <p className="text-sm text-muted-foreground">Loading stats…</p>
      )}
      {tab === "stats" && statsError && (
        <p className="text-sm text-destructive">Failed to load stats. Check that your account has admin access and the server is reachable.</p>
      )}
      {tab === "stats" && stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total users", value: stats.users.total },
            { label: "New today", value: stats.users.today },
            { label: "Questions", value: stats.questions },
            { label: "Answers", value: stats.answers },
            { label: "Pending reports", value: stats.reports.pending },
            { label: "Total reports", value: stats.reports.total },
            { label: "This week", value: stats.users.this_week },
          ].map(({ label, value }) => (
            <Card key={label}>
              <CardContent className="p-4">
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Users ─────────────────────────────────────────────────── */}
      {tab === "users" && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={userSearch}
              onChange={(e) => {
                setUserSearch(e.target.value);
                setUserOffset(0);
              }}
              placeholder="Search by username, name, or email…"
              className="pl-9"
            />
          </div>

          {usersLoading && <p className="text-sm text-muted-foreground">Loading users…</p>}
          {usersError && <p className="text-sm text-destructive">Failed to load users. You may not have admin access or the server returned an error.</p>}

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  {[
                    "User",
                    "Email",
                    "Role",
                    "Answers",
                    "Joined",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usersData?.users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-t border-border hover:bg-accent/30"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{u.display_name}</p>
                        <p className="text-xs text-muted-foreground">
                          @{u.username}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {u.email}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.role === "admin"
                            ? "bg-destructive/20 text-destructive"
                            : u.role === "moderator"
                              ? "bg-primary/20 text-primary"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">{u.answer_count}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) =>
                          updateRole.mutate({
                            id: u.id,
                            role: e.target.value as
                              | "user"
                              | "moderator"
                              | "admin",
                          })
                        }
                        className="rounded border border-border bg-background px-2 py-1 text-xs"
                      >
                        <option value="user">user</option>
                        <option value="moderator">moderator</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between">
            <p className="text-xs text-muted-foreground">
              {usersData?.total ?? 0} total users
            </p>
            <div className="flex gap-2">
              {userOffset > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUserOffset((o) => o - 20)}
                >
                  Previous
                </Button>
              )}
              {(usersData?.users.length ?? 0) === 20 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUserOffset((o) => o + 20)}
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Reports ────────────────────────────────────────────────── */}
      {tab === "reports" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {["pending", "reviewed", "actioned"].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setReportStatus(s);
                  setReportOffset(0);
                }}
                className={`rounded-full px-3 py-1 text-sm capitalize transition-colors ${
                  reportStatus === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {reportsLoading && <p className="text-sm text-muted-foreground">Loading reports…</p>}
          {reportsError && <p className="text-sm text-destructive">Failed to load reports. Check admin access.</p>}

          <div className="space-y-3">
            {reportsData?.reports.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="rounded bg-muted px-2 py-0.5 text-xs capitalize">
                          {r.content_type}
                        </span>
                        <span className="rounded bg-destructive/20 text-destructive px-2 py-0.5 text-xs capitalize">
                          {r.reason.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Reported by @{r.reporter_username} ·{" "}
                        {new Date(r.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        ID: {r.content_id}
                      </p>
                    </div>
                    {r.status === "pending" && (
                      <div className="flex gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            actionReport.mutate({
                              id: r.id,
                              status: "reviewed",
                            })
                          }
                          disabled={actionReport.isPending}
                        >
                          Reviewed
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            actionReport.mutate({
                              id: r.id,
                              status: "actioned",
                            })
                          }
                          disabled={actionReport.isPending}
                        >
                          Action
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {reportsData?.reports.length === 0 && (
              <p className="py-8 text-center text-muted-foreground">
                No {reportStatus} reports
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            {reportOffset > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReportOffset((o) => o - 20)}
              >
                Previous
              </Button>
            )}
            {(reportsData?.reports.length ?? 0) === 20 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReportOffset((o) => o + 20)}
              >
                Next
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
