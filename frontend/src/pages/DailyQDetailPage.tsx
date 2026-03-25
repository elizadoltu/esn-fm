import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import {
  useDailyQDetail,
  useDailyQAnswersById,
  useDailyQLike,
} from "@/hooks/useDailyQuestion";
import { useAuth } from "@/context/useAuth";
import { Button } from "@/components/ui/button";
import DailyQAnswerCard from "@/features/dailyQ/DailyQAnswerCard";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function DailyQDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [offset, setOffset] = useState(0);

  const { data: question, isLoading: qLoading } = useDailyQDetail(id);
  const { data: answersData, isLoading: answersLoading } = useDailyQAnswersById(
    id,
    offset
  );
  const like = useDailyQLike();

  const items = answersData?.items ?? [];

  if (qLoading) {
    return (
      <div className="py-16 text-center text-muted-foreground">Loading…</div>
    );
  }

  if (!question) {
    return (
      <div className="py-16 text-center text-destructive">
        Question not found.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-3 text-sm">
        <Link
          to="/home"
          className="text-muted-foreground hover:text-foreground"
        >
          Home
        </Link>
        <span className="text-muted-foreground">/</span>
        <Link
          to="/daily-q/archive"
          className="text-muted-foreground hover:text-foreground"
        >
          Past Questions
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="truncate text-foreground font-medium">
          {formatDate(question.published_at)}
        </span>
      </div>

      {/* Question card */}
      <div className="mb-8 rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-primary/5 p-6 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            Question of the Day · {formatDate(question.published_at)}
          </span>
        </div>
        <p className="text-lg font-semibold leading-snug">{question.content}</p>
        <p className="mt-3 text-sm text-muted-foreground">
          {question.answer_count}{" "}
          {question.answer_count === 1 ? "answer" : "answers"}
        </p>
      </div>

      {/* Answers */}
      {answersLoading && (
        <div className="py-8 text-center text-muted-foreground">
          Loading answers…
        </div>
      )}

      {!answersLoading && items.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No public answers yet.
        </p>
      )}

      <div className="space-y-4">
        {items.map((a) => (
          <DailyQAnswerCard
            key={a.id}
            answer={a}
            onLike={(answerId) => like.mutate(answerId)}
            isAuthenticated={isAuthenticated}
          />
        ))}
      </div>

      {!answersLoading && (
        <div className="mt-6 flex justify-center gap-3">
          {offset > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset((o) => Math.max(0, o - 20))}
            >
              Previous
            </Button>
          )}
          {items.length === 20 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset((o) => o + 20)}
            >
              Load more
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
