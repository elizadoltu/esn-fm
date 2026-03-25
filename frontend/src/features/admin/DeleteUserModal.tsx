import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDeleteUser } from "@/hooks/useAdmin";
import type { DeleteUserTarget } from "@/types/admin";

const DELETE_REASONS = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "policy_violation", label: "Policy violation" },
  { value: "other", label: "Other" },
];

interface DeleteUserModalProps {
  user: DeleteUserTarget;
  onClose: () => void;
}

export default function DeleteUserModal({
  user,
  onClose,
}: Readonly<DeleteUserModalProps>) {
  const [reason, setReason] = useState("spam");
  const [message, setMessage] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const deleteUser = useDeleteUser();

  function handleConfirm() {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }
    deleteUser.mutate(
      { id: user.id, reason, message: message || undefined },
      { onSuccess: onClose }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl">
        <h2 className="mb-1 text-lg font-bold">Delete account</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{user.display_name}</span>{" "}
          (@{user.username}) · {user.email}
        </p>

        {confirmed ? (
          <>
            <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3">
              <p className="text-sm font-semibold text-destructive">
                This action is permanent and cannot be undone.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                The account will be permanently deleted and a notification email
                will be sent to <strong>{user.email}</strong>.
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setConfirmed(false)}>
                Go back
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirm}
                disabled={deleteUser.isPending}
              >
                {deleteUser.isPending ? "Deleting…" : "Yes, permanently delete"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-3 space-y-1.5">
              <label htmlFor="delete-reason" className="text-sm font-medium">
                Reason
              </label>
              <select
                id="delete-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
              >
                {DELETE_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4 space-y-1.5">
              <label className="text-sm font-medium">
                Custom message{" "}
                <span className="text-muted-foreground font-normal">
                  (optional — sent in the email)
                </span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Additional context for the user…"
                rows={3}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm resize-none"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={handleConfirm}>
                <Trash2 className="h-4 w-4 mr-1" />
                Delete account
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
