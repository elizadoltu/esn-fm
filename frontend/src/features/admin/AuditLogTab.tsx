import { useState } from "react";
import { useAuditLogs } from "@/hooks/useAdmin";
import PaginationBar from "@/features/admin/PaginationBar";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuditLogTab() {
  const [auditOffset, setAuditOffset] = useState(0);
  const { data: auditData, isLoading } = useAuditLogs({ offset: auditOffset });

  return (
    <div className="space-y-4">
      {isLoading && (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Admin", "Action", "Target", "Details", "Time"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((n) => (
                <tr key={n} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <Skeleton className="h-3.5 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-5 w-28 rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-3.5 w-16" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-3.5 w-40" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-3.5 w-28" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {["Admin", "Action", "Target", "Details", "Time"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {auditData?.logs.map((log) => (
              <tr
                key={log.id}
                className="border-t border-border hover:bg-accent/30"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-xs">
                    {log.admin_display_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    @{log.admin_username}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-muted px-2 py-0.5 text-xs font-mono">
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground capitalize">
                  {log.target_type}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate font-mono">
                  {Object.keys(log.metadata).length > 0
                    ? JSON.stringify(log.metadata)
                    : "—"}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
            {auditData?.logs.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground text-sm"
                >
                  No audit log entries
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PaginationBar
        offset={auditOffset}
        limit={20}
        total={auditData?.total ?? 0}
        onPrev={() => setAuditOffset((o) => o - 20)}
        onNext={() => setAuditOffset((o) => o + 20)}
      />
    </div>
  );
}
