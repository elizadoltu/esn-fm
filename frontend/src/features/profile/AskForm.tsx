import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendQuestion } from "@/api/questions.api";

const MAX_CHARS = 300;

interface AskFormProps {
  recipientUsername: string;
  isSelf: boolean;
  me: { display_name?: string } | null;
  isAuthenticated: boolean;
}

export default function AskForm({
  recipientUsername,
  isSelf,
  me,
  isAuthenticated,
}: Readonly<AskFormProps>) {
  const [content, setContent] = useState("");
  const [senderName, setSenderName] = useState("");
  const [anonymous, setAnonymous] = useState(!isAuthenticated);
  const [showInFeed, setShowInFeed] = useState(isAuthenticated);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await sendQuestion({
        recipient_username: recipientUsername,
        content,
        sender_name:
          isSelf || anonymous ? undefined : senderName || me?.display_name,
        show_in_feed: showInFeed,
      });
      setSubmitted(true);
      setContent("");
      setSenderName("");
    } catch {
      setError("Failed to send question. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <Card>
        <CardContent className="p-5 flex flex-col items-center gap-2 py-8">
          <CheckCircle2 className="h-8 w-8 text-primary" />
          <p className="font-semibold">Question sent!</p>
          <button
            className="text-sm text-muted-foreground hover:underline"
            onClick={() => setSubmitted(false)}
          >
            Ask another
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm font-medium mb-3">
          {isSelf ? "Ask yourself something" : "Ask a question"}
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What would you like to ask?"
              maxLength={MAX_CHARS}
              rows={3}
              required
              className="resize-none text-sm"
            />
            <p
              className={`text-right text-xs mt-1 ${
                content.length >= MAX_CHARS
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
            >
              {content.length}/{MAX_CHARS}
            </p>
          </div>

          {!isSelf && (
            <>
              <div className="flex items-center gap-2">
                <input
                  id={`anon-${recipientUsername}`}
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <Label
                  htmlFor={`anon-${recipientUsername}`}
                  className="cursor-pointer font-normal text-sm"
                >
                  Send anonymously
                </Label>
              </div>
              {!anonymous && (
                <Input
                  type="text"
                  placeholder={me?.display_name ?? "Your name (optional)"}
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  maxLength={60}
                  className="text-sm"
                />
              )}
            </>
          )}

          <div className="flex items-center gap-2">
            <input
              id={`feed-${recipientUsername}`}
              type="checkbox"
              checked={showInFeed}
              onChange={(e) => setShowInFeed(e.target.checked)}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            <Label
              htmlFor={`feed-${recipientUsername}`}
              className="cursor-pointer font-normal text-sm"
            >
              Show on public feed
            </Label>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <Button
            type="submit"
            size="sm"
            className="w-full"
            disabled={loading || !content.trim()}
          >
            <Send className="h-4 w-4 mr-1" />
            {loading ? "Sending…" : "Send question"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
