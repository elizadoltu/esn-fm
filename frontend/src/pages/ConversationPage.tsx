import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Send, UserCircle2 } from "lucide-react";
import { useMessages, useSendDm } from "@/hooks/useMessages";
import { useAuth } from "@/context/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useProfile } from "@/hooks/useProfile";

export default function ConversationPage() {
  const { username } = useParams<{ username: string }>();
  const { user: me } = useAuth();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: profile } = useProfile(username ?? "");
  const { data, isLoading } = useMessages(username ?? "");
  const send = useSendDm(username ?? "");

  const messages = data?.messages ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !username) return;
    await send.mutateAsync({ recipient_username: username, content: text.trim() });
    setText("");
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col px-4 py-4" style={{ height: "calc(100vh - 3.5rem)" }}>
      {/* Header */}
      <div className="mb-4 flex items-center gap-3 border-b border-border pb-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/messages">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.display_name}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <UserCircle2 className="h-9 w-9 text-muted-foreground/40" />
        )}
        <div>
          <Link to={`/${username}`} className="font-medium hover:underline">
            {profile?.display_name ?? username}
          </Link>
          <p className="text-xs text-muted-foreground">@{username}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {isLoading && (
          <p className="text-center text-sm text-muted-foreground py-8">Loading…</p>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === me?.id;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                  isMine
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-card border border-border rounded-bl-sm"
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 border-t border-border pt-4">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message…"
          maxLength={500}
          rows={2}
          className="flex-1 resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (text.trim()) handleSend(e as unknown as React.FormEvent);
            }
          }}
        />
        <Button
          type="submit"
          size="sm"
          disabled={!text.trim() || send.isPending}
          className="self-end"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
