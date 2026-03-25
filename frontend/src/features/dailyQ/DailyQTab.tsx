import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitDailyQAnswer } from "@/hooks/useDailyQuestion";
import type { DailyQuestion, DailyQAnswer } from "@/api/dailyQuestion.api";
import DailyQAnswerCard from "./DailyQAnswerCard";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  dailyQ: DailyQuestion | null;
  answers: DailyQAnswer[];
  isLoading: boolean;
  onLike: (id: string) => void;
  isAuthenticated: boolean;
}

function AnswerPrompt({
  questionId,
  existingAnswer,
}: Readonly<{
  questionId: string;
  existingAnswer: DailyQuestion["my_answer"];
}>) {
  const [content, setContent] = useState(existingAnswer?.content ?? "");
  const [showOnFeed, setShowOnFeed] = useState(
    existingAnswer?.show_on_feed ?? true
  );
  const submit = useSubmitDailyQAnswer();

  function handleSubmit() {
    if (!content.trim()) return;
    submit.mutate({ questionId, content: content.trim(), showOnFeed });
  }

  if (existingAnswer) {
    return (
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">
          Your answer
        </p>
        <p className="text-sm leading-relaxed">{existingAnswer.content}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="mb-3 text-sm font-semibold text-muted-foreground">
        Share your answer…
      </p>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your answer (up to 1000 characters)"
        rows={4}
        maxLength={1000}
        className="mb-3 resize-none"
      />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={showOnFeed}
            onChange={(e) => setShowOnFeed(e.target.checked)}
            className="rounded"
          />{" "}
          Show in Daily Q tab
        </label>
        <Button
          size="sm"
          disabled={!content.trim() || submit.isPending}
          onClick={handleSubmit}
        >
          {submit.isPending ? "Posting…" : "Post answer"}
        </Button>
      </div>
    </div>
  );
}

export default function DailyQTab({
  dailyQ,
  answers,
  isLoading,
  onLike,
  isAuthenticated,
}: Readonly<Props>) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Question card skeleton */}
        <div className="rounded-2xl border border-border bg-muted/30 p-6 space-y-3">
          <Skeleton className="mx-auto h-3.5 w-32 rounded" />
          <Skeleton className="mx-auto h-5 w-4/5 rounded" />
          <Skeleton className="mx-auto h-5 w-3/5 rounded" />
        </div>
        {/* Answer card skeletons */}
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="rounded-2xl border border-border bg-card p-5 space-y-3"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-28 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
            </div>
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-5/6 rounded" />
            <div className="flex gap-4 pt-1">
              <Skeleton className="h-5 w-12 rounded" />
              <Skeleton className="h-5 w-12 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!dailyQ) {
    return (
      <div className="py-16 text-center">
        <Sparkles className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
        <h2 className="mb-2 text-xl font-bold">No question today yet</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Check back soon — a new question drops every day.
        </p>
        <Link
          to="/daily-q/archive"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <History className="h-4 w-4" />
          View past questions
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Question card */}
      <div className="rounded-2xl border border-border bg-linear-to-br from-primary/10 to-primary/5 p-6 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            Question of the Day
          </span>
        </div>
        <p className="text-lg font-semibold leading-snug">{dailyQ.content}</p>
      </div>

      {/* Answer prompt or own answer */}
      {isAuthenticated && (
        <AnswerPrompt
          questionId={dailyQ.id}
          existingAnswer={dailyQ.my_answer}
        />
      )}

      {/* All answers */}
      {answers.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {answers.length} {answers.length === 1 ? "answer" : "answers"}
          </h3>
          {answers.map((a) => (
            <DailyQAnswerCard
              key={a.id}
              answer={a}
              onLike={onLike}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>
      )}

      {answers.length === 0 && dailyQ.my_answer && (
        <p className="text-center text-sm text-muted-foreground">
          You're the first to answer — others will show up here.
        </p>
      )}

      {/* Archive link */}
      <div className="flex justify-center pt-2">
        <Link
          to="/daily-q/archive"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <History className="h-4 w-4" />
          View past questions
        </Link>
      </div>
    </div>
  );
}
