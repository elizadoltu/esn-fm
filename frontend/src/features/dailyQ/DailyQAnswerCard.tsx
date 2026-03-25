import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, UserCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getDailyQComments, postDailyQComment } from "@/api/dailyQuestion.api";
import type { DailyQAnswer, DailyQComment } from "@/api/dailyQuestion.api";

interface Props {
  answer: DailyQAnswer;
  onLike: (id: string) => void;
  isAuthenticated: boolean;
}

export default function DailyQAnswerCard({
  answer,
  onLike,
  isAuthenticated,
}: Props) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<DailyQComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);

  async function toggleComments() {
    if (!showComments && comments.length === 0) {
      setLoadingComments(true);
      try {
        const data = await getDailyQComments(answer.id);
        setComments(data);
      } finally {
        setLoadingComments(false);
      }
    }
    setShowComments((v) => !v);
  }

  async function handlePostComment() {
    if (!commentText.trim()) return;
    setPostingComment(true);
    try {
      const c = await postDailyQComment(answer.id, commentText.trim());
      setComments((prev) => [...prev, c]);
      setCommentText("");
    } finally {
      setPostingComment(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      {/* Author */}
      <div className="mb-3 flex items-center gap-3">
        <Link to={`/${answer.author_username}`}>
          {answer.author_avatar_url ? (
            <img
              src={answer.author_avatar_url}
              alt={answer.author_display_name}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <UserCircle2 className="h-9 w-9 text-muted-foreground/40" />
          )}
        </Link>
        <div className="min-w-0">
          <Link
            to={`/${answer.author_username}`}
            className="text-sm font-semibold hover:underline"
          >
            {answer.author_display_name}
          </Link>
          <p className="text-xs text-muted-foreground">
            @{answer.author_username}
          </p>
        </div>
      </div>

      {/* Answer content */}
      <p className="text-base leading-relaxed">{answer.content}</p>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-4">
        <button
          onClick={() => isAuthenticated && onLike(answer.id)}
          disabled={!isAuthenticated}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            answer.liked_by_me
              ? "text-rose-500"
              : "text-muted-foreground hover:text-rose-500"
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <Heart
            className={`h-4 w-4 ${answer.liked_by_me ? "fill-current" : ""}`}
          />
          {answer.likes}
        </button>
        <button
          onClick={toggleComments}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          {answer.comment_count}
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          {loadingComments && (
            <p className="text-xs text-muted-foreground">Loading comments…</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <UserCircle2 className="h-5 w-5 shrink-0 text-muted-foreground/40" />
              <div className="min-w-0">
                <span className="text-xs font-semibold">
                  {c.author_display_name}{" "}
                </span>
                <span className="text-xs text-muted-foreground">
                  {c.content}
                </span>
              </div>
            </div>
          ))}
          {isAuthenticated && (
            <div className="flex gap-2 pt-1">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment…"
                rows={1}
                className="min-h-0 resize-none text-xs"
                maxLength={200}
              />
              <Button
                size="sm"
                variant="ghost"
                disabled={!commentText.trim() || postingComment}
                onClick={handlePostComment}
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
