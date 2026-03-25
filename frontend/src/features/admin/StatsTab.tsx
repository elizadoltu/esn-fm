import { useAdminStats } from "@/hooks/useAdmin";
import { Card, CardContent } from "@/components/ui/card";

const STAT_ITEMS = (stats: NonNullable<ReturnType<typeof useAdminStats>["data"]>) => [
  { label: "Total users", value: stats.users.total },
  { label: "New today", value: stats.users.today },
  { label: "Questions", value: stats.questions },
  { label: "Answers", value: stats.answers },
  { label: "Pending reports", value: stats.reports.pending },
  { label: "Total reports", value: stats.reports.total },
  { label: "This week", value: stats.users.this_week },
];

export default function StatsTab() {
  const { data: stats, isLoading, error } = useAdminStats();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading stats…</p>;
  }
  if (error) {
    return (
      <p className="text-sm text-destructive">
        Failed to load stats. Check that your account has admin access and the
        server is reachable.
      </p>
    );
  }
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {STAT_ITEMS(stats).map(({ label, value }) => (
        <Card key={label}>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
