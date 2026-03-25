import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useActionReport } from "@/hooks/useAdmin";
import type { ActionReportTarget } from "@/types/admin";

const ACTION_TYPES = [
  { value: "warning", label: "Warning issued" },
  { value: "content_removed", label: "Content removed" },
  { value: "account_suspended", label: "Account suspended" },
  { value: "other", label: "Other action" },
];

const ACTION_TEMPLATES: Record<string, string> = {
  warning:
    "Your content was found to violate our community guidelines. This is a formal warning. Future violations may result in content removal or account suspension.",
  content_removed:
    "Your content has been removed for violating our community guidelines. Please review our terms of service to ensure your future content complies with our policies.",
  account_suspended:
    "Your account has been suspended due to repeated or severe violations of our community guidelines. Please contact support if you believe this was an error.",
  other: "",
};

interface ActionReportModalProps {
  report: ActionReportTarget;
  onClose: () => void;
}

export default function ActionReportModal({
  report,
  onClose,
}: Readonly<ActionReportModalProps>) {
  const [actionType, setActionType] = useState("warning");
  const [message, setMessage] = useState(ACTION_TEMPLATES.warning);
  const actionReport = useActionReport();

  function handleActionTypeChange(value: string) {
    setActionType(value);
    setMessage(ACTION_TEMPLATES[value] ?? "");
  }

  function handleSubmit() {
    actionReport.mutate(
      {
        id: report.id,
        status: "actioned",
        action_type: actionType,
        action_message: message.trim() || undefined,
      },
      { onSuccess: onClose }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl">
        <h2 className="mb-1 text-lg font-bold">Action report</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Choose an action and optionally compose a message to send to the
          content owner. The reporter&apos;s identity will not be revealed.
        </p>

        <div className="mb-3 space-y-1.5">
          <label htmlFor="action-type" className="text-sm font-medium">
            Action type
          </label>
          <select
            id="action-type"
            value={actionType}
            onChange={(e) => handleActionTypeChange(e.target.value)}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
          >
            {ACTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4 space-y-1.5">
          <label htmlFor="action-message" className="text-sm font-medium">
            Message to user{" "}
            <span className="text-muted-foreground font-normal">
              (optional — sent by email)
            </span>
          </label>
          <textarea
            id="action-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Leave blank to send no message…"
            rows={4}
            maxLength={1000}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm resize-none"
          />
          <p className="text-right text-xs text-muted-foreground">
            {message.length}/1000
          </p>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={actionReport.isPending}>
            {actionReport.isPending ? "Saving…" : "Confirm action"}
          </Button>
        </div>
      </div>
    </div>
  );
}
