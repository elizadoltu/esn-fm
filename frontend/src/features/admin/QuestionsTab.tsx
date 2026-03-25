import { useState } from "react";
import { EyeOff, Eye } from "lucide-react";
import { useAdminQuestions } from "@/hooks/useAdmin";
import { Card, CardContent } from "@/components/ui/card";
import PaginationBar from "@/features/admin/PaginationBar";
import { Skeleton } from "@/components/ui/skeleton";

export default function QuestionsTab() {
  const [anonymousOnly, setAnonymousOnly] = useState(false);
  const [questionOffset, setQuestionOffset] = useState(0);
  const { data: questionsData, isLoading } = useAdminQuestions({
    anonymous_only: anonymousOnly,
    offset: questionOffset,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            setAnonymousOnly((v) => !v);
            setQuestionOffset(0);
          }}
          className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors ${
            anonymousOnly
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          {anonymousOnly ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
          {anonymousOnly ? "Anonymous only" : "All questions"}
        </button>
        <p className="text-xs text-muted-foreground">
          Real sender identity is visible only to admins and moderators. Each
          access is logged in the audit trail.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <Card key={n}>
              <CardContent className="p-4 space-y-3">
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-28 rounded" />
                  <Skeleton className="h-5 w-16 rounded" />
                </div>
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-4/5 rounded" />
                <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/50 bg-muted/30 p-3">
                  <div className="space-y-1.5">
                    <Skeleton className="h-2.5 w-16 rounded" />
                    <Skeleton className="h-3.5 w-24 rounded" />
                    <Skeleton className="h-3 w-20 rounded" />
                  </div>
                  <div className="space-y-1.5">
                    <Skeleton className="h-2.5 w-16 rounded" />
                    <Skeleton className="h-3.5 w-24 rounded" />
                    <Skeleton className="h-3 w-20 rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {questionsData?.questions.map((q) => (
          <Card key={q.id}>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {q.is_anonymous && (
                    <span className="flex items-center gap-1 rounded bg-yellow-500/15 px-2 py-0.5 text-xs font-medium text-yellow-600 dark:text-yellow-400">
                      <EyeOff className="h-3 w-3" />
                      Anonymous to recipient
                    </span>
                  )}
                  {q.is_answered && (
                    <span className="rounded bg-green-500/15 px-2 py-0.5 text-xs text-green-600 dark:text-green-400">
                      answered
                    </span>
                  )}
                </div>

                <p className="text-sm leading-relaxed">{q.content}</p>

                <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/50 bg-muted/30 p-3 text-xs">
                  <div>
                    <p className="mb-0.5 font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">
                      Recipient
                    </p>
                    <p className="font-medium">{q.recipient.display_name}</p>
                    <p className="text-muted-foreground">
                      @{q.recipient.username}
                    </p>
                  </div>
                  <div>
                    <p className="mb-0.5 font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">
                      {q.is_anonymous
                        ? "Real sender (hidden from recipient)"
                        : "Sender"}
                    </p>
                    {q.real_sender && (
                      <>
                        <p className="font-medium">
                          {q.real_sender.display_name}
                        </p>
                        <p className="text-muted-foreground">
                          @{q.real_sender.username}
                        </p>
                        <p className="text-muted-foreground">
                          {q.real_sender.email}
                        </p>
                      </>
                    )}
                    {!q.real_sender && q.sender_name && (
                      <p className="text-muted-foreground">
                        {q.sender_name} (no account)
                      </p>
                    )}
                    {!q.real_sender && !q.sender_name && (
                      <p className="text-muted-foreground italic">
                        No identity data
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  {new Date(q.created_at).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
        {questionsData?.questions.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">
            No questions found
          </p>
        )}
      </div>

      <PaginationBar
        offset={questionOffset}
        limit={20}
        total={questionsData?.total ?? 0}
        onPrev={() => setQuestionOffset((o) => o - 20)}
        onNext={() => setQuestionOffset((o) => o + 20)}
      />
    </div>
  );
}
