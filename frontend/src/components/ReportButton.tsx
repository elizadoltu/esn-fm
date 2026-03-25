import { useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitReport } from "@/api/reports.api";
import type { ContentType, ReportReason } from "@/api/reports.api";
import { toast } from "sonner";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "hate_speech", label: "Hate speech" },
  { value: "inappropriate", label: "Inappropriate" },
  { value: "other", label: "Other" },
];

interface ReportButtonProps {
  contentType: ContentType;
  contentId: string;
  /** small = icon-only ghost button (feed cards), full = labelled button (profile) */
  size?: "small" | "full";
}

export default function ReportButton({
  contentType,
  contentId,
  size = "small",
}: Readonly<ReportButtonProps>) {
  const [open, setOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState<ReportReason>("spam");
  const [message, setMessage] = useState("");

  function handleOpen(e: React.MouseEvent) {
    e.preventDefault();
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    setReason("spam");
    setMessage("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await submitReport({
        content_type: contentType,
        content_id: contentId,
        reason,
        message: message.trim() || undefined,
      });
      setReported(true);
      handleClose();
      toast.success("Report submitted. We'll review it shortly.");
    } catch {
      // silently ignore duplicate reports (backend uses ON CONFLICT DO NOTHING)
    } finally {
      setLoading(false);
    }
  }

  if (reported) {
    return (
      <span className="text-xs text-muted-foreground px-2 py-1">Reported</span>
    );
  }

  return (
    <>
      {size === "small" ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
          onClick={handleOpen}
          title="Report"
        >
          <Flag className="h-3.5 w-3.5" />
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="text-muted-foreground"
          onClick={handleOpen}
        >
          <Flag className="h-4 w-4 mr-1" />
          Report
        </Button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-lg border border-border bg-card p-5 shadow-xl">
            <h2 className="mb-4 text-base font-semibold">
              Report {contentType}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="report-reason" className="text-sm font-medium">
                  Reason
                </label>
                <select
                  id="report-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value as ReportReason)}
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                >
                  {REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="report-message" className="text-sm font-medium">
                  Additional details{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </label>
                <textarea
                  id="report-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe the issue in more detail…"
                  maxLength={500}
                  rows={3}
                  className="w-full resize-none rounded border border-border bg-background px-3 py-2 text-sm"
                />
                <p className="text-right text-xs text-muted-foreground">
                  {message.length}/500
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={loading}
                >
                  {loading ? "Submitting…" : "Submit report"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
