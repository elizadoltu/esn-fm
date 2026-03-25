import { useEffect } from "react";
import { Bell, CheckCheck, X } from "lucide-react";
import { Link } from "react-router-dom";
import {
  useNotifications,
  useMarkAllRead,
  useMarkRead,
  useDeleteNotification,
} from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/useAuth";
import { useBrowserNotifTrigger } from "@/hooks/useBrowserNotifTrigger";
import FollowRequestActions from "@/features/notifications/FollowRequestActions";
import NotificationSkeleton from "@/components/NotificationSkeleton";
import {
  notificationIcon,
  notificationText,
  notificationLink,
  timeAgo,
} from "@/features/notifications/notificationHelpers";

export default function NotificationsPage() {
  const { data: notifications = [], isLoading } = useNotifications();
  useBrowserNotifTrigger(notifications);
  const markAll = useMarkAllRead();
  const markOne = useMarkRead();
  const { user } = useAuth();
  const deleteNotif = useDeleteNotification();

  const unread = notifications.filter((n) => !n.is_read).length;

  // Auto-mark all as read when the page is opened and there are unread notifications
  useEffect(() => {
    if (unread > 0 && !isLoading) {
      markAll.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

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
        <div className="space-y-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <NotificationSkeleton key={n} />
          ))}
        </div>
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
                  className="h-11 w-11 p-0 text-muted-foreground hover:text-destructive transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    deleteNotif.mutate(n.id);
                  }}
                  disabled={deleteNotif.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Link>
          ))}
      </div>
    </div>
  );
}
