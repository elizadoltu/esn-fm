import {
  useModerationAlerts,
  useMarkAllModerationAlertsRead,
  useMarkModerationAlertRead,
} from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface AlertsTabProps {
  onViewReports: () => void;
}

export default function AlertsTab({ onViewReports }: Readonly<AlertsTabProps>) {
  const { data: alertsData, isLoading } = useModerationAlerts();
  const markAllRead = useMarkAllModerationAlertsRead();
  const markOneRead = useMarkModerationAlertRead();

  const unreadCount = alertsData?.filter((a) => !a.is_read).length ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          In-app alerts for new reports. Only visible to admins and moderators.
        </p>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            Mark all as read
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card p-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16 rounded" />
                  <Skeleton className="h-5 w-24 rounded" />
                </div>
                <Skeleton className="h-3 w-36 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
              <Skeleton className="h-7 w-20 rounded-md shrink-0" />
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {alertsData?.map((alert) => (
          <div
            key={alert.id}
            className={`flex items-start justify-between gap-4 rounded-lg border p-4 transition-colors ${
              alert.is_read
                ? "border-border bg-card"
                : "border-primary/30 bg-primary/5"
            }`}
          >
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {!alert.is_read && (
                  <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                )}
                {alert.content_type && (
                  <span className="rounded bg-muted px-2 py-0.5 text-xs capitalize">
                    {alert.content_type}
                  </span>
                )}
                {alert.reason && (
                  <span className="rounded bg-destructive/20 text-destructive px-2 py-0.5 text-xs capitalize">
                    {alert.reason.replaceAll("_", " ")}
                  </span>
                )}
                {alert.report_status && (
                  <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground capitalize">
                    {alert.report_status}
                  </span>
                )}
              </div>
              {alert.reporter_username && (
                <p className="text-xs text-muted-foreground">
                  Reported by @{alert.reporter_username}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {new Date(alert.created_at).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onViewReports}
                className="text-xs text-primary hover:underline whitespace-nowrap"
              >
                View reports →
              </button>
              {!alert.is_read && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => markOneRead.mutate(alert.id)}
                  disabled={markOneRead.isPending}
                >
                  Dismiss
                </Button>
              )}
            </div>
          </div>
        ))}
        {!isLoading && alertsData?.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">
            No moderation alerts
          </p>
        )}
      </div>
    </div>
  );
}
