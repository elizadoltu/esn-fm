import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getToken } from "@/lib/auth";

export function useSSE() {
  const qc = useQueryClient();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const apiUrl = import.meta.env.VITE_API_URL ?? "";
    const es = new EventSource(
      `${apiUrl}/api/events?token=${encodeURIComponent(token)}`
    );
    esRef.current = es;

    es.addEventListener("notification", () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    });

    es.addEventListener("dm", () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["messages"] });
      qc.invalidateQueries({ queryKey: ["dm"] });
    });

    es.addEventListener("like", (e: MessageEvent) => {
      const { answer_id } = JSON.parse(e.data) as { answer_id: string };
      qc.invalidateQueries({ queryKey: ["mainFeed"] });
      qc.invalidateQueries({ queryKey: ["homeFeed"] });
      qc.invalidateQueries({ queryKey: ["trending"] });
      // Invalidate the specific answer's profile feed if cached
      qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === "feed" });
      console.debug("[sse] like on answer", answer_id);
    });

    es.addEventListener("comment", (e: MessageEvent) => {
      const { answer_id } = JSON.parse(e.data) as { answer_id: string };
      qc.invalidateQueries({ queryKey: ["mainFeed"] });
      qc.invalidateQueries({ queryKey: ["homeFeed"] });
      qc.invalidateQueries({ queryKey: ["trending"] });
      qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === "feed" });
      qc.invalidateQueries({ queryKey: ["comments", answer_id] });
    });

    es.onerror = () => {
      // EventSource auto-reconnects on error; nothing to do
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [qc]);
}
