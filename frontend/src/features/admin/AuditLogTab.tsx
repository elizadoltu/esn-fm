import { useState } from "react";
import { useAuditLogs } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";

export default function AuditLogTab() {
  const [auditOffset, setAuditOffset] = useState(0);
  const { data: auditData, isLoading } = useAuditLogs({ offset: auditOffset });

  return (
    <div className="space-y-4">
      {isLoading && (
        <p className="text-sm text-muted-foreground">Loading audit logs…</p>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              {["Admin", "Action", "Target", "Details", "Time"].map((h) => (
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
            {auditData?.logs.map((log) => (
              <tr key={log.id} className="border-t border-border hover:bg-accent/30">
                <td className="px-4 py-3">
                  <p className="font-medium text-xs">{log.admin_display_name}</p>
                  <p className="text-xs text-muted-foreground">@{log.admin_username}</p>
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
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">
                  No audit log entries
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-2">
        {auditOffset > 0 && (
          <Button variant="outline" size="sm" onClick={() => setAuditOffset((o) => o - 50)}>
            Previous
          </Button>
        )}
        {(auditData?.logs.length ?? 0) === 50 && (
          <Button variant="outline" size="sm" onClick={() => setAuditOffset((o) => o + 50)}>
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
