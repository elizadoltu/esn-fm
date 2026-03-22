import { Link } from "react-router-dom";
import { Mail, UserCircle2 } from "lucide-react";
import { useConversations } from "@/hooks/useMessages";

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function MessagesPage() {
  const { data: conversations = [], isLoading } = useConversations();

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Messages</h1>

      {isLoading && (
        <p className="py-12 text-center text-muted-foreground">Loading…</p>
      )}

      {!isLoading && conversations.length === 0 && (
        <div className="py-16 text-center">
          <Mail className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-muted-foreground">No conversations yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Visit someone's profile to send them a message
          </p>
        </div>
      )}

      <div className="space-y-1">
        {conversations.map((conv) => (
          <Link
            key={conv.id}
            to={`/messages/${conv.other_user.username}`}
            className={`flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-accent ${
              conv.unread_count > 0 ? "bg-accent/40" : ""
            }`}
          >
            {conv.other_user.avatar_url ? (
              <img
                src={conv.other_user.avatar_url}
                alt={conv.other_user.display_name}
                className="h-11 w-11 rounded-full object-cover shrink-0"
              />
            ) : (
              <UserCircle2 className="h-11 w-11 text-muted-foreground/40 shrink-0" />
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className={`font-medium truncate ${conv.unread_count > 0 ? "text-foreground" : "text-foreground/80"}`}>
                  {conv.other_user.display_name}
                </p>
                <span className="text-xs text-muted-foreground shrink-0">
                  {timeAgo(conv.created_at)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {conv.is_mine && (
                  <span className="text-xs text-muted-foreground">You: </span>
                )}
                <p className={`text-sm truncate ${conv.unread_count > 0 ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                  {conv.content}
                </p>
                {conv.unread_count > 0 && (
                  <span className="ml-auto shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                    {conv.unread_count}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
