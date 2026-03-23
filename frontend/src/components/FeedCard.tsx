import { useState, useRef } from "react";
import {
  Heart,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Send,
  Trash2,
  ImagePlus,
  X,
} from "lucide-react";
import { extractApiError } from "@/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { FeedItem } from "@/api/answers.api";
import {
  useComments,
  usePostComment,
  useDeleteComment,
  useLikeComment,
} from "@/hooks/useComments";
import { useAuth } from "@/context/useAuth";
import type { Comment } from "@/api/comments.api";
import ReportButton from "@/components/ReportButton";
import { uploadImage } from "@/api/upload.api";
import { compressImage } from "@/lib/compressImage";

interface FeedCardProps {
  item: FeedItem;
  onLike: (answerId: string) => void;
  isAuthenticated: boolean;
  showAuthor?: boolean;
}

function CommentItem({
  comment,
  answerId,
  onDelete,
  onReply,
}: Readonly<{
  comment: Comment;
  answerId: string;
  onDelete: (id: string) => void;
  onReply: (parentId: string, authorName: string) => void;
}>) {
  const { user } = useAuth();
  const isOwn = user?.id === comment.author.id;
  const likeComment = useLikeComment(answerId);

  return (
    <div className="space-y-2">
      <div className="rounded-lg bg-accent/60 px-3 py-2">
        <p className="text-xs font-medium text-foreground/80 mb-0.5">
          {comment.author.display_name ?? comment.author.username ?? "Deleted"}
        </p>
        {comment.content && (
          <p className="text-sm text-foreground">{comment.content}</p>
        )}
        {comment.image_url && !comment.is_deleted && (
          <img
            src={comment.image_url}
            alt=""
            className="mt-1.5 w-full rounded-md object-cover max-h-60"
          />
        )}
        {!comment.is_deleted && (
          <div className="flex items-center gap-1 mt-1.5">
            {user && (
              <button
                className={`flex items-center gap-1 text-xs transition-colors ${
                  comment.liked_by_me
                    ? "text-destructive"
                    : "text-muted-foreground hover:text-destructive"
                }`}
                onClick={() => likeComment.mutate(comment.id)}
                disabled={likeComment.isPending}
              >
                <Heart
                  className={`h-3 w-3 ${comment.liked_by_me ? "fill-current" : ""}`}
                />
                {comment.like_count > 0 && <span>{comment.like_count}</span>}
              </button>
            )}
            <button
              className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-2"
              onClick={() =>
                onReply(
                  comment.id,
                  comment.author.display_name ?? comment.author.username ?? ""
                )
              }
            >
              Reply
            </button>
            {isOwn && (
              <button
                className="text-xs text-muted-foreground hover:text-destructive transition-colors ml-auto"
                onClick={() => onDelete(comment.id)}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="ml-6 space-y-2">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="rounded-lg bg-muted/50 px-3 py-2">
              <p className="text-xs font-medium text-foreground/80 mb-0.5">
                {reply.author.display_name ??
                  reply.author.username ??
                  "Deleted"}
              </p>
              {reply.content && (
                <p className="text-sm text-foreground">{reply.content}</p>
              )}
              {reply.image_url && !reply.is_deleted && (
                <img
                  src={reply.image_url}
                  alt=""
                  className="mt-1.5 w-full rounded-md object-cover max-h-60"
                />
              )}
              {!reply.is_deleted && (
                <div className="flex items-center gap-1 mt-1.5">
                  {user && (
                    <button
                      className={`flex items-center gap-1 text-xs transition-colors ${
                        reply.liked_by_me
                          ? "text-destructive"
                          : "text-muted-foreground hover:text-destructive"
                      }`}
                      onClick={() => likeComment.mutate(reply.id)}
                      disabled={likeComment.isPending}
                    >
                      <Heart
                        className={`h-3 w-3 ${reply.liked_by_me ? "fill-current" : ""}`}
                      />
                      {reply.like_count > 0 && <span>{reply.like_count}</span>}
                    </button>
                  )}
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-2"
                    onClick={() =>
                      onReply(
                        comment.id,
                        reply.author.display_name ?? reply.author.username ?? ""
                      )
                    }
                  >
                    Reply
                  </button>
                  {user?.id === reply.author.id && (
                    <button
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors ml-auto"
                      onClick={() => onDelete(reply.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
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
  const [commentError, setCommentError] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(
    null
  );
  const [commentImageFile, setCommentImageFile] = useState<File | null>(null);
  const [commentImagePreview, setCommentImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const commentImageInputRef = useRef<HTMLInputElement>(null);

  const { data: comments = [] } = useComments(
    showComments ? item.answer_id : ""
  );
  const postComment = usePostComment(item.answer_id);
  const deleteComment = useDeleteComment(item.answer_id);

  function handleCommentImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCommentImageFile(file);
    setCommentImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  }

  function removeCommentImage() {
    setCommentImageFile(null);
    if (commentImagePreview) URL.revokeObjectURL(commentImagePreview);
    setCommentImagePreview(null);
  }

  async function handleSubmitComment() {
    if (!commentText.trim() && !commentImageFile) return;
    setCommentError(null);
    try {
      let imageUrl: string | null = null;
      if (commentImageFile) {
        setUploadingImage(true);
        const compressed = await compressImage(commentImageFile);
        imageUrl = await uploadImage(compressed, "answer");
        setUploadingImage(false);
      }
      await postComment.mutateAsync({
        answer_id: item.answer_id,
        content: commentText.trim() || undefined,
        image_url: imageUrl,
        parent_comment_id: replyTo?.id,
      });
      setCommentText("");
      setReplyTo(null);
      removeCommentImage();
    } catch (err) {
      setUploadingImage(false);
      setCommentError(
        extractApiError(err, "Failed to post comment. Try again.")
      );
    }
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

        {/* Answer image */}
        {item.answer_image_url && (
          <img
            src={item.answer_image_url}
            alt=""
            className="mt-3 w-full rounded-lg object-cover max-h-80"
          />
        )}

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

          {isAuthenticated && (
            <div className="ml-auto">
              <ReportButton contentType="answer" contentId={item.answer_id} />
            </div>
          )}
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
                answerId={item.answer_id}
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
                {commentImagePreview && (
                  <div className="relative inline-block">
                    <img
                      src={commentImagePreview}
                      alt=""
                      className="h-24 rounded-md object-cover"
                    />
                    <button
                      className="absolute top-0.5 right-0.5 rounded-full bg-black/60 p-0.5 text-white"
                      onClick={removeCommentImage}
                    >
                      <X className="h-3 w-3" />
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
                  <div className="flex flex-col gap-1 self-end">
                    <button
                      type="button"
                      className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => commentImageInputRef.current?.click()}
                      title="Add image"
                    >
                      <ImagePlus className="h-4 w-4" />
                    </button>
                    <Button
                      size="sm"
                      onClick={handleSubmitComment}
                      disabled={
                        (!commentText.trim() && !commentImageFile) ||
                        postComment.isPending ||
                        uploadingImage
                      }
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <input
                  ref={commentImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCommentImageSelect}
                />
                <div className="flex items-center justify-between">
                  {commentError ? (
                    <p className="text-xs text-destructive">{commentError}</p>
                  ) : (
                    <span />
                  )}
                  <p className="text-xs text-muted-foreground">
                    {commentText.length}/200
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
