import { Check, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approveFollowRequest, declineFollowRequest } from "@/api/follows.api";
import { Button } from "@/components/ui/button";
import type { Notification } from "@/api/notifications.api";

interface FollowRequestActionsProps {
  n: Notification;
  onDone: () => void;
}

export default function FollowRequestActions({
  n,
  onDone,
}: Readonly<FollowRequestActionsProps>) {
  const qc = useQueryClient();

  const approve = useMutation({
    mutationFn: () => approveFollowRequest(n.actor!.username),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      onDone();
    },
  });

  const decline = useMutation({
    mutationFn: () => declineFollowRequest(n.actor!.username),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      onDone();
    },
  });

  const busy = approve.isPending || decline.isPending;

  return (
    <div className="mt-2 flex gap-2">
      <Button
        size="sm"
        className="h-7 px-3 text-xs"
        onClick={(e) => {
          e.preventDefault();
          approve.mutate();
        }}
        disabled={busy}
      >
        <Check className="h-3 w-3 mr-1" />
        Approve
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-7 px-3 text-xs"
        onClick={(e) => {
          e.preventDefault();
          decline.mutate();
        }}
        disabled={busy}
      >
        <X className="h-3 w-3 mr-1" />
        Decline
      </Button>
    </div>
  );
}
