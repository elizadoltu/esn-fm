import { useState } from "react";
import { Trash2, MessageCircle, X, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Question } from "@/api/questions.api";
import { extractApiError } from "@/api/client";

interface QuestionCardProps {
  question: Question;
  onAnswer: (questionId: string, content: string) => Promise<void>;
  onDelete: (questionId: string) => void;
  isAnswering?: boolean;
  isDeleting?: boolean;
}

export default function QuestionCard({
  question,
  onAnswer,
  onDelete,
  isAnswering = false,
  isDeleting = false,
}: Readonly<QuestionCardProps>) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleAnswer() {
    if (!text.trim()) return;
    setError(null);
    try {
      await onAnswer(question.id, text);
      setOpen(false);
      setText("");
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setOpen(false);
                    setText("");
                    setError(null);
                  }}
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleAnswer}
                  disabled={!text.trim() || isAnswering}
                >
                  <Send className="h-4 w-4" />
                  {isAnswering ? "Posting…" : "Post answer"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex gap-2">
            <Button size="sm" onClick={() => setOpen(true)}>
              <MessageCircle className="h-4 w-4" />
              Answer
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(question.id)}
              disabled={isDeleting}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
