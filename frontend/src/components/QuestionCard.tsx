import { useRef, useState } from "react";
import { Trash2, MessageCircle, X, Send, Camera, Loader2, Archive } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Question } from "@/api/questions.api";
import { extractApiError } from "@/api/client";
import { uploadImage } from "@/api/upload.api";
import { compressImage } from "@/lib/compressImage";

interface QuestionCardProps {
  question: Question;
  onAnswer: (
    questionId: string,
    content: string,
    imageUrl?: string
  ) => Promise<void>;
  onDelete: (questionId: string) => void;
  onArchive: (questionId: string) => void;
  isAnswering?: boolean;
  isDeleting?: boolean;
  isArchiving?: boolean;
}

export default function QuestionCard({
  question,
  onAnswer,
  onDelete,
  onArchive,
  isAnswering = false,
  isDeleting = false,
  isArchiving = false,
}: Readonly<QuestionCardProps>) {
  const [open, setOpen] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    setUploadError(null);
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const url = await uploadImage(compressed, "answer");
      setImageUrl(url);
      setImagePreview(url);
    } catch {
      setUploadError("Upload failed. Try again.");
      setImagePreview(null);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function clearImage() {
    setImageUrl(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleClose() {
    setOpen(false);
    setText("");
    clearImage();
    setError(null);
    setUploadError(null);
  }

  function renderActions() {
    if (open) return null;
    if (confirmArchive) {
      return (
        <div className="mt-4 space-y-1.5">
          <p className="text-xs font-medium">Archive this question?</p>
          <p className="text-xs text-muted-foreground">
            Archived questions are automatically deleted after 30 days.
          </p>
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleArchiveConfirm}
              disabled={isArchiving}
              className="text-muted-foreground hover:text-foreground"
            >
              <Archive className="h-4 w-4" />
              {isArchiving ? "Archiving…" : "Yes, archive"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmArchive(false)}>
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        </div>
      );
    }
    if (confirmDelete) {
      return (
        <div className="mt-4 space-y-1.5">
          <p className="text-xs font-medium">Delete this question?</p>
          <p className="text-xs text-muted-foreground">
            This action cannot be undone.
          </p>
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? "Deleting…" : "Yes, delete"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="mt-4 flex gap-2 flex-wrap">
        <Button size="sm" onClick={() => setOpen(true)}>
          <MessageCircle className="h-4 w-4" />
          Answer
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirmArchive(true)}
          disabled={isArchiving}
          className="text-muted-foreground hover:text-foreground"
        >
          <Archive className="h-4 w-4" />
          Archive
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirmDelete(true)}
          disabled={isDeleting}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>
    );
  }

  function handleArchiveConfirm() {
    onArchive(question.id);
    setConfirmArchive(false);
  }

  function handleDeleteConfirm() {
    onDelete(question.id);
    toast.success("Question deleted");
    setConfirmDelete(false);
  }

  async function handleAnswer() {
    if (!text.trim()) return;
    setError(null);
    try {
      await onAnswer(question.id, text, imageUrl ?? undefined);
      handleClose();
    } catch (err) {
      setError(
        extractApiError(err, "Failed to post answer. Please try again.")
      );
    }
  }

  return (
    <Card>
      <CardContent className="p-5">
        <p className="mb-1 text-xs text-muted-foreground">
          {question.sender_name ? question.sender_name : "Anonymous"}
        </p>
        <p className="font-medium text-foreground">{question.content}</p>

        {open ? (
          <div className="mt-4 space-y-2">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write your answer…"
              maxLength={1000}
              rows={4}
              autoFocus
            />

            {/* Image attachment */}
            {imagePreview ? (
              <div className="relative w-fit">
                <img
                  src={imagePreview}
                  alt=""
                  className="max-h-40 rounded-lg object-cover"
                />
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  </div>
                )}
                {!uploading && (
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white shadow"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Camera className="h-4 w-4" />
                Add photo
              </button>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFile}
            />

            {uploadError && (
              <p className="text-xs text-destructive">{uploadError}</p>
            )}
            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {text.length}/1000
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleClose}>
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleAnswer}
                  disabled={!text.trim() || isAnswering || uploading}
                >
                  <Send className="h-4 w-4" />
                  {isAnswering ? "Posting…" : "Post answer"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          renderActions()
        )}
      </CardContent>
    </Card>
  );
}
