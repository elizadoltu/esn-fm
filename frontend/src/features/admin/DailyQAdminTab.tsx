import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Plus, Send, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import PaginationBar from "@/features/admin/PaginationBar";
import {
  adminListDailyQuestions,
  adminCreateDailyQuestion,
  adminPublishDailyQuestion,
  adminArchiveDailyQuestion,
  type AdminDailyQuestion,
} from "@/api/dailyQuestion.api";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

const PAGE_SIZE = 20;

export default function DailyQAdminTab() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [offset, setOffset] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "dailyQuestions", offset],
    queryFn: () => adminListDailyQuestions({ limit: PAGE_SIZE, offset }),
  });

  const questions: AdminDailyQuestion[] = data?.questions ?? [];

  const createMutation = useMutation({
    mutationFn: adminCreateDailyQuestion,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "dailyQuestions"] });
      setNewContent("");
      setScheduledFor("");
      setShowForm(false);
    },
  });

  const publishMutation = useMutation({
    mutationFn: adminPublishDailyQuestion,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin", "dailyQuestions"] }),
  });

  const archiveMutation = useMutation({
    mutationFn: adminArchiveDailyQuestion,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin", "dailyQuestions"] }),
  });

  function handleCreate() {
    if (!newContent.trim()) return;
    createMutation.mutate({
      content: newContent.trim(),
      scheduled_for: scheduledFor || undefined,
    });
  }

  const active = questions.find((q) => q.is_active);
  const archived = questions.filter((q) => !q.is_active);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Question of the Day</h2>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New question
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <p className="text-sm font-medium">Write today's question</p>
          <Textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Ask something interesting… (up to 300 characters)"
            rows={3}
            maxLength={300}
            className="resize-none"
          />
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-muted-foreground">
                Schedule for (optional)
              </label>
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              />
            </div>
            <div className="flex gap-2 self-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!newContent.trim() || createMutation.isPending}
                onClick={handleCreate}
              >
                {createMutation.isPending ? "Saving…" : "Save draft"}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Saving creates a draft. Use "Publish" to activate it and notify all
            users.
          </p>
        </div>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {/* Active question */}
      {active && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
            Active
          </h3>
          <QuestionRow
            q={active}
            onArchive={() => archiveMutation.mutate(active.id)}
            archiving={archiveMutation.isPending}
          />
        </section>
      )}

      {/* Draft / archived */}
      {archived.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Drafts &amp; archived
          </h3>
          <div className="space-y-3">
            {archived.map((q) => (
              <QuestionRow
                key={q.id}
                q={q}
                onPublish={() => publishMutation.mutate(q.id)}
                publishing={
                  publishMutation.isPending &&
                  publishMutation.variables === q.id
                }
              />
            ))}
          </div>
        </section>
      )}

      {!isLoading && questions.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          No questions yet. Create the first one above.
        </p>
      )}

      {(data?.total ?? 0) > PAGE_SIZE && (
        <PaginationBar
          offset={offset}
          limit={PAGE_SIZE}
          total={data?.total ?? 0}
          onPrev={() => setOffset((o) => o - PAGE_SIZE)}
          onNext={() => setOffset((o) => o + PAGE_SIZE)}
        />
      )}
    </div>
  );
}

function QuestionRow({
  q,
  onPublish,
  onArchive,
  publishing,
  archiving,
}: {
  q: AdminDailyQuestion;
  onPublish?: () => void;
  onArchive?: () => void;
  publishing?: boolean;
  archiving?: boolean;
}) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug">{q.content}</p>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
          <span>Published: {formatDate(q.published_at)}</span>
          <span>Answers: {q.answer_count}</span>
          {q.created_by_username && <span>By: @{q.created_by_username}</span>}
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        {onPublish && (
          <Button size="sm" disabled={publishing} onClick={onPublish}>
            <Send className="mr-1.5 h-3.5 w-3.5" />
            {publishing ? "Publishing…" : "Publish"}
          </Button>
        )}
        {onArchive && (
          <Button
            size="sm"
            variant="outline"
            disabled={archiving}
            onClick={onArchive}
          >
            <Archive className="mr-1.5 h-3.5 w-3.5" />
            {archiving ? "…" : "Deactivate"}
          </Button>
        )}
      </div>
    </div>
  );
}
