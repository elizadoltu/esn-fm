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

    es.onerror = () => {
      // EventSource auto-reconnects on error; nothing to do
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [qc]);
}
