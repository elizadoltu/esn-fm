import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ChevronRight } from "lucide-react";
import { useDailyQArchive } from "@/hooks/useDailyQuestion";
import { Button } from "@/components/ui/button";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function DailyQArchivePage() {
  const [offset, setOffset] = useState(0);
  const { data, isLoading } = useDailyQArchive(offset);

  const items = data?.items ?? [];

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          to="/home"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Home
        </Link>
        <span className="text-muted-foreground">/</span>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Past Questions</h1>
        </div>
      </div>

      {isLoading && (
        <div className="py-16 text-center text-muted-foreground">Loading…</div>
      )}

      {!isLoading && items.length === 0 && offset === 0 && (
        <div className="py-16 text-center">
          <Sparkles className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">No archived questions yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {items.map((q) => (
          <Link
            key={q.id}
            to={`/daily-q/${q.id}`}
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium leading-snug line-clamp-2">
                {q.content}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDate(q.published_at)} · {q.answer_count}{" "}
                {q.answer_count === 1 ? "answer" : "answers"}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>

      {!isLoading && (
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
