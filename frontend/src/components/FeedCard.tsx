import { useState } from "react";
import {
  Heart,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Send,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { FeedItem } from "@/api/answers.api";
import {
  useComments,
  usePostComment,
  useDeleteComment,
} from "@/hooks/useComments";
import { useAuth } from "@/context/useAuth";
import type { Comment } from "@/api/comments.api";

interface FeedCardProps {
  item: FeedItem;
  onLike: (answerId: string) => void;
  isAuthenticated: boolean;
  showAuthor?: boolean;
}

function CommentItem({
  comment,
  onDelete,
  onReply,
}: Readonly<{
  comment: Comment;
  onDelete: (id: string) => void;
  onReply: (parentId: string, authorName: string) => void;
}>) {
  const { user } = useAuth();
  const isOwn = user?.id === comment.author.id;

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2 group">
        <div className="flex-1 rounded-lg bg-accent/60 px-3 py-2">
          <p className="text-xs font-medium text-foreground/80 mb-0.5">
            {comment.author.display_name ??
              comment.author.username ??
              "Deleted"}
          </p>
          <p className="text-sm text-foreground">{comment.content}</p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!comment.is_deleted && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground"
              onClick={() =>
                onReply(
                  comment.id,
                  comment.author.display_name ?? comment.author.username ?? ""
                )
              }
            >
              Reply
            </Button>
          )}
          {isOwn && !comment.is_deleted && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-destructive hover:text-destructive"
              onClick={() => onDelete(comment.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="ml-6 space-y-2">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="flex items-start gap-2 group">
              <div className="flex-1 rounded-lg bg-muted/50 px-3 py-2">
                <p className="text-xs font-medium text-foreground/80 mb-0.5">
                  {reply.author.display_name ??
                    reply.author.username ??
                    "Deleted"}
                </p>
                <p className="text-sm text-foreground">{reply.content}</p>
              </div>
              {!reply.is_deleted && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() =>
                    onReply(
                      comment.id,
                      reply.author.display_name ?? reply.author.username ?? ""
                    )
                  }
                >
                  Reply
                </Button>
              )}
              {user?.id === reply.author.id && !reply.is_deleted && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onDelete(reply.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FeedCard({
  item,
  onLike,
  isAuthenticated,
  showAuthor = false,
}: Readonly<FeedCardProps>) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(
    null
  );

  const { data: comments = [] } = useComments(
    showComments ? item.answer_id : ""
  );
  const postComment = usePostComment(item.answer_id);
  const deleteComment = useDeleteComment(item.answer_id);

  async function handleSubmitComment() {
    if (!commentText.trim()) return;
    await postComment.mutateAsync({
      answer_id: item.answer_id,
      content: commentText.trim(),
      parent_comment_id: replyTo?.id,
    });
    setCommentText("");
    setReplyTo(null);
  }

  return (
    <Card>
      <CardContent className="p-5">
        {/* Author (home feed only) */}
        {showAuthor && item.author_username && (
          <div className="mb-3 flex items-center gap-2">
            {item.author_avatar_url ? (
              <img
                src={item.author_avatar_url}
                alt={item.author_display_name}
                className="h-7 w-7 rounded-full object-cover"
              />
            ) : (
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                {item.author_display_name?.charAt(0).toUpperCase()}
              </div>
            )}
            <a
              href={`/${item.author_username}`}
              className="text-sm font-medium hover:underline"
            >
              {item.author_display_name}
            </a>
            <span className="text-xs text-muted-foreground">
              @{item.author_username}
            </span>
          </div>
        )}

        {/* Question */}
        <div className="mb-4 rounded-lg bg-muted/60 px-4 py-3">
          <p className="mb-1 text-xs text-muted-foreground">
            {item.sender_name ? item.sender_name : "Anonymous"} asked
          </p>
          <p className="text-sm font-medium text-foreground">{item.question}</p>
        </div>

        {/* Answer */}
        <p className="text-sm text-foreground">{item.answer}</p>

        {/* Footer */}
        <div className="mt-4 flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => isAuthenticated && onLike(item.answer_id)}
            className={
              item.liked_by_me
                ? "text-destructive hover:text-destructive"
                : "text-muted-foreground hover:text-destructive"
            }
            disabled={!isAuthenticated}
            title={isAuthenticated ? undefined : "Sign in to like"}
          >
            <Heart
              className={`h-4 w-4 ${item.liked_by_me ? "fill-current" : ""}`}
            />
            <span className="text-xs">{item.likes}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments((v) => !v)}
            className="text-muted-foreground hover:text-foreground"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs">{item.comment_count}</span>
            {showComments ? (
              <ChevronUp className="h-3 w-3 ml-1" />
            ) : (
              <ChevronDown className="h-3 w-3 ml-1" />
            )}
          </Button>
        </div>

        {/* Comments section */}
        {showComments && (
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            {comments.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                No comments yet. Be the first!
              </p>
            )}

            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onDelete={(id) => deleteComment.mutate(id)}
                onReply={(parentId, name) => {
                  setReplyTo({ id: parentId, name });
                  setCommentText(`@${name} `);
                }}
              />
            ))}

            {isAuthenticated && (
              <div className="space-y-2 pt-2">
                {replyTo && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Replying to {replyTo.name}</span>
                    <button
                      className="text-destructive hover:underline"
                      onClick={() => setReplyTo(null)}
                    >
                      Cancel
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <Textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={
                      replyTo ? `Reply to ${replyTo.name}…` : "Add a comment…"
                    }
                    maxLength={200}
                    rows={2}
                    className="flex-1 resize-none text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={handleSubmitComment}
                    disabled={!commentText.trim() || postComment.isPending}
                    className="self-end"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-right text-xs text-muted-foreground">
                  {commentText.length}/200
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
