import { useInbox, useDeleteQuestion, useArchiveQuestion, usePostAnswer } from "@/hooks/useInbox";
import QuestionCard from "@/components/QuestionCard";

export default function InboxPage() {
  const { data: questions, isLoading } = useInbox();
  const deleteQ = useDeleteQuestion();
  const archiveQ = useArchiveQuestion();
  const answer = usePostAnswer();

  if (isLoading) {
    return (
      <div className="py-16 text-center text-muted-foreground">Loading…</div>
    );
  }

  const count = questions?.length ?? 0;
  const plural = count > 1 ? "s" : "";
  const subtitle =
    count > 0 ? `${count} unanswered question${plural}` : "All caught up!";

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">Inbox</h1>
      <p className="mb-6 text-sm text-muted-foreground">{subtitle}</p>

      {questions?.length === 0 && (
        <p className="py-12 text-center text-muted-foreground">
          No unanswered questions yet.
        </p>
      )}

      <div className="space-y-4">
        {questions?.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            onAnswer={async (questionId, content, imageUrl) => {
              await answer.mutateAsync({
                question_id: questionId,
                content,
                image_url: imageUrl ?? null,
              });
            }}
            onDelete={(id) => deleteQ.mutate(id)}
            onArchive={(id) => archiveQ.mutate(id)}
            isAnswering={answer.isPending}
            isDeleting={deleteQ.isPending}
            isArchiving={archiveQ.isPending}
          />
        ))}
      </div>
    </div>
  );
}
