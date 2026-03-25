import { useAdminStats } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import { Users, MessageSquare, Flag, TrendingUp } from "lucide-react";

const userGrowthConfig: ChartConfig = {
  today: { label: "Today", color: "hsl(var(--primary))" },
  this_week: { label: "This week", color: "hsl(var(--primary) / 0.6)" },
  total: { label: "Total", color: "hsl(var(--primary) / 0.3)" },
};

const reportsConfig: ChartConfig = {
  pending: { label: "Pending", color: "hsl(var(--destructive))" },
  resolved: { label: "Resolved", color: "hsl(var(--primary))" },
};

export default function StatsTab() {
  const { data: stats, isLoading, error } = useAdminStats();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(["users", "questions", "answers", "reports"] as const).map((k) => (
            <Card key={k}>
              <CardContent className="p-5">
                <div className="h-8 w-16 animate-pulse rounded bg-muted" />
                <div className="mt-2 h-3 w-24 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
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

  const userGrowthData = [
    { name: "Today", value: stats.users.today, fill: "hsl(var(--primary))" },
    {
      name: "This week",
      value: stats.users.this_week,
      fill: "hsl(var(--primary) / 0.6)",
    },
  ];

  const resolved = stats.reports.total - stats.reports.pending;
  const reportsData = [
    {
      name: "Pending",
      value: stats.reports.pending,
      fill: "hsl(var(--destructive))",
    },
    { name: "Resolved", value: resolved, fill: "hsl(var(--primary))" },
  ];

  const resolvedPct =
    stats.reports.total > 0
      ? Math.round((resolved / stats.reports.total) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-bold">{stats.users.total}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Total users
                </p>
              </div>
              <span className="rounded-lg bg-primary/10 p-2">
                <Users className="h-4 w-4 text-primary" />
              </span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                +{stats.users.today}
              </span>{" "}
              today ·{" "}
              <span className="font-medium text-foreground">
                +{stats.users.this_week}
              </span>{" "}
              this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-bold">{stats.questions}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Questions sent
                </p>
              </div>
              <span className="rounded-lg bg-blue-500/10 p-2">
                <MessageSquare className="h-4 w-4 text-blue-500" />
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-bold">{stats.answers}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Answers posted
                </p>
              </div>
              <span className="rounded-lg bg-green-500/10 p-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
              </span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {stats.questions > 0
                ? `${Math.round((stats.answers / stats.questions) * 100)}% answer rate`
                : "No questions yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-bold">{stats.reports.pending}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Pending reports
                </p>
              </div>
              <span className="rounded-lg bg-destructive/10 p-2">
                <Flag className="h-4 w-4 text-destructive" />
              </span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {stats.reports.total} total reports
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* User growth bar chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">New users</CardTitle>
            <p className="text-xs text-muted-foreground">Signups over time</p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={userGrowthConfig} className="h-40 w-full">
              <BarChart
                data={userGrowthData}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Report resolution radial chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Report status
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {resolvedPct}% resolved of {stats.reports.total} total
            </p>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {stats.reports.total === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                No reports yet
              </div>
            ) : (
              <ChartContainer config={reportsConfig} className="h-40 w-full">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="55%"
                  outerRadius="90%"
                  data={reportsData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <PolarAngleAxis
                    type="number"
                    domain={[0, stats.reports.total]}
                    angleAxisId={0}
                    tick={false}
                  />
                  <RadialBar dataKey="value" background cornerRadius={6} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </RadialBarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Content summary row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="sm:col-span-3">
          <CardContent className="p-5">
            <div className="grid grid-cols-3 divide-x divide-border text-center">
              <div className="px-4">
                <p className="text-2xl font-bold">{stats.users.today}</p>
                <p className="text-xs text-muted-foreground">New today</p>
              </div>
              <div className="px-4">
                <p className="text-2xl font-bold">{stats.users.this_week}</p>
                <p className="text-xs text-muted-foreground">This week</p>
              </div>
              <div className="px-4">
                <p className="text-2xl font-bold">{resolvedPct}%</p>
                <p className="text-xs text-muted-foreground">
                  Reports resolved
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
