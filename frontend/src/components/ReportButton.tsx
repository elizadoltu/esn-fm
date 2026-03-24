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

  async function handleReport(reason: ReportReason) {
    setLoading(true);
    try {
      await submitReport({
        content_type: contentType,
        content_id: contentId,
        reason,
      });
      setReported(true);
      toast.success("Report submitted. We'll review it shortly.");
    } catch {
      // silently ignore duplicate reports (backend uses ON CONFLICT DO NOTHING)
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }

  if (reported) {
    return (
      <span className="text-xs text-muted-foreground px-2 py-1">Reported</span>
    );
  }

  return (
    <div className="relative">
      {size === "small" ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.preventDefault();
            setOpen((v) => !v);
          }}
          title="Report"
          disabled={loading}
        >
          <Flag className="h-3.5 w-3.5" />
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="text-muted-foreground"
          onClick={() => setOpen((v) => !v)}
          disabled={loading}
        >
          <Flag className="h-4 w-4 mr-1" />
          Report
        </Button>
      )}

      {open && (
        <>
          <button
            type="button"
            aria-label="Close"
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-20 mt-1 min-w-36 rounded-lg border border-border bg-card shadow-lg p-1">
            {REASONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => handleReport(r.value)}
                className="flex w-full items-center rounded-md px-3 py-1.5 text-sm hover:bg-accent transition-colors text-left"
              >
                {r.label}
              </button>
            ))}
            <div className="mt-1 border-t border-border pt-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex w-full items-center rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent transition-colors text-left"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
