import { useQuery } from "@tanstack/react-query";
import { search, getTrending } from "@/api/search.api";
import { getSuggestions } from "@/api/follows.api";

export function useSearch(
  q: string,
  type: "all" | "users" | "answers" = "all"
) {
  return useQuery({
    queryKey: ["search", q, type],
    queryFn: () => search(q, type),
    enabled: q.trim().length >= 1,
  });
}

export function useTrending() {
  return useQuery({
    queryKey: ["trending"],
    queryFn: getTrending,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSuggestions() {
  return useQuery({
    queryKey: ["suggestions"],
    queryFn: getSuggestions,
    staleTime: 2 * 60 * 1000,
  });
}
