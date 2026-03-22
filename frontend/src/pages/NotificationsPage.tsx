import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  HelpCircle,
  CheckCheck,
  Mail,
  Check,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useNotifications,
  useMarkAllRead,
  useMarkRead,
  useDeleteNotification,
} from "@/hooks/useNotifications";
import { approveFollowRequest, declineFollowRequest } from "@/api/follows.api";
import { Button } from "@/components/ui/button";
import type { Notification, NotificationType } from "@/api/notifications.api";
import { useAuth } from "@/context/useAuth";
import { useBrowserNotifTrigger } from "@/hooks/useBrowserNotifTrigger";

function notificationIcon(type: NotificationType) {
  switch (type) {
    case "new_like":
      return <Heart className="h-4 w-4 text-destructive" />;
    case "new_comment":
      return <MessageCircle className="h-4 w-4 text-primary" />;
    case "new_reply":
      return <MessageCircle className="h-4 w-4 text-muted-foreground" />;
    case "new_follower":
      return <UserPlus className="h-4 w-4 text-primary" />;
    case "new_question":
      return <HelpCircle className="h-4 w-4 text-primary" />;
    case "new_answer":
      return <HelpCircle className="h-4 w-4 text-green-500" />;
    case "new_dm":
      return <Mail className="h-4 w-4 text-primary" />;
    case "follow_request":
      return <UserPlus className="h-4 w-4 text-yellow-500" />;
  }
}

function notificationText(n: Notification): string {
  const name = n.actor?.display_name ?? n.actor?.username ?? "Someone";
  switch (n.type) {
    case "new_like":
      return `${name} liked your answer`;
    case "new_comment":
      return `${name} commented on your answer`;
    case "new_reply":
      return `${name} replied to your comment`;
    case "new_follower":
      return `${name} started following you`;
    case "new_question":
      return `${name} asked you a question`;
    case "new_answer":
      return `${name} answered your question`;
    case "new_dm":
      return `${name} sent you a message`;
    case "follow_request":
      return `${name} wants to follow you`;
  }
}

function notificationLink(n: Notification, myUsername: string): string {
  switch (n.type) {
    case "new_follower":
    case "follow_request":
    case "new_answer":
      return `/${n.actor?.username ?? ""}`;
    case "new_like":
    case "new_comment":
    case "new_reply":
      return `/${myUsername}`;
    case "new_dm":
      return `/messages/${n.actor?.username ?? ""}`;
    case "new_question":
      return "/inbox";
  }
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function FollowRequestActions({
  n,
  onDone,
}: Readonly<{ n: Notification; onDone: () => void }>) {
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

export default function NotificationsPage() {
  const { data: notifications = [], isLoading } = useNotifications();
  useBrowserNotifTrigger(notifications);
  const markAll = useMarkAllRead();
  const markOne = useMarkRead();
  const { user } = useAuth();
  const deleteNotif = useDeleteNotification();

  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unread > 0 && (
            <p className="text-sm text-muted-foreground">{unread} unread</p>
          )}
        </div>
        {unread > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {isLoading && (
        <p className="py-12 text-center text-muted-foreground">Loading…</p>
      )}

      {!isLoading && notifications.length === 0 && (
        <div className="py-16 text-center">
          <Bell className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-muted-foreground">No notifications yet</p>
        </div>
      )}

      <div className="space-y-1">
        {notifications
          .filter((n) => n.type !== "new_dm")
          .map((n) => (
            <Link
              key={n.id}
              to={notificationLink(n, user?.username ?? "")}
              onClick={() => {
                if (!n.is_read) markOne.mutate(n.id);
              }}
              className={`group flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-accent ${
                n.is_read ? "" : "bg-accent/40"
              }`}
            >
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                {notificationIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${n.is_read ? "" : "font-medium"}`}>
                  {notificationText(n)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {timeAgo(n.created_at)}
                </p>
                {n.type === "follow_request" && n.actor && (
                  <FollowRequestActions
                    n={n}
                    onDone={() => markOne.mutate(n.id)}
                  />
                )}
              </div>
              <div className="flex flex-col items-center gap-1 shrink-0">
                {!n.is_read && (
                  <div className="h-2 w-2 rounded-full bg-primary" />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.preventDefault();
                    deleteNotif.mutate(n.id);
                  }}
                  disabled={deleteNotif.isPending}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </Link>
          ))}
      </div>
    </div>
  );
}
