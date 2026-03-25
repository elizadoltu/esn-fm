import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  HelpCircle,
  Mail,
} from "lucide-react";
import type { Notification, NotificationType } from "@/api/notifications.api";

export function notificationIcon(type: NotificationType) {
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
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
}

export function notificationText(n: Notification): string {
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
      return "Someone sent you a question";
    case "new_answer":
      return `${name} answered your question`;
    case "new_dm":
      return `${name} sent you a message`;
    case "follow_request":
      return `${name} wants to follow you`;
  }
}

export function notificationLink(n: Notification, myUsername: string): string {
  switch (n.type) {
    case "new_follower":
    case "follow_request":
      return `/${n.actor?.username ?? ""}`;
    case "new_like":
    case "new_comment":
    case "new_reply":
      return n.reference_id
        ? `/${myUsername}#answer-${n.reference_id}`
        : `/${myUsername}`;
    case "new_answer":
      return n.reference_id
        ? `/${n.actor?.username ?? ""}#answer-${n.reference_id}`
        : `/${n.actor?.username ?? ""}`;
    case "new_dm":
      return `/messages/${n.actor?.username ?? ""}`;
    case "new_question":
      return "/inbox";
    default:
      return "/notifications";
  }
}

export function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
