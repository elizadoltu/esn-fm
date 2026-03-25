import { useState } from "react";
import { Link } from "react-router-dom";
import { useAdminReports, useActionReport } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ActionReportModal from "@/features/admin/ActionReportModal";
import PaginationBar from "@/features/admin/PaginationBar";
import { Skeleton } from "@/components/ui/skeleton";
import type { ActionReportTarget } from "@/types/admin";

export default function ReportsTab() {
  const [reportStatus, setReportStatus] = useState("pending");
  const [reportOffset, setReportOffset] = useState(0);
  const [actionTarget, setActionTarget] = useState<ActionReportTarget | null>(
    null
  );

  const {
    data: reportsData,
    isLoading,
    error,
  } = useAdminReports({
    status: reportStatus,
    offset: reportOffset,
  });
  const actionReport = useActionReport();

  return (
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

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="rounded-lg border border-border bg-card p-4 space-y-2"
            >
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded" />
                <Skeleton className="h-5 w-24 rounded" />
              </div>
              <Skeleton className="h-3.5 w-48 rounded" />
              <Skeleton className="h-3.5 w-full rounded" />
            </div>
          ))}
        </div>
      )}
      {error && (
        <p className="text-sm text-destructive">
          Failed to load reports. Check admin access.
        </p>
      )}

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
                      {r.reason.replaceAll("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Reported by @{r.reporter_username} ·{" "}
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                  {r.message && (
                    <p className="text-xs text-muted-foreground italic border-l-2 border-border pl-2 mt-1">
                      &ldquo;{r.message}&rdquo;
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-muted-foreground font-mono">
                      ID: {r.content_id}
                    </p>
                    {r.content_owner_username && (
                      <Link
                        to={`/${r.content_owner_username}`}
                        className="text-xs text-primary hover:underline"
                      >
                        View {r.content_type} →
                      </Link>
                    )}
                  </div>
                </div>
                {r.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        actionReport.mutate({ id: r.id, status: "reviewed" })
                      }
                      disabled={actionReport.isPending}
                    >
                      Reviewed
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        setActionTarget({
                          id: r.id,
                          content_type: r.content_type,
                          reason: r.reason,
                        })
                      }
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

      <PaginationBar
        offset={reportOffset}
        limit={20}
        total={reportsData?.total ?? 0}
        onPrev={() => setReportOffset((o) => o - 20)}
        onNext={() => setReportOffset((o) => o + 20)}
      />

      {actionTarget && (
        <ActionReportModal
          report={actionTarget}
          onClose={() => setActionTarget(null)}
        />
      )}
    </div>
  );
}
