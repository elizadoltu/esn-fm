import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getHomeFeed, getMainFeed } from "@/api/feed.api";
import { toggleLike } from "@/api/answers.api";

export function useHomeFeed(offset = 0) {
  return useQuery({
    queryKey: ["homeFeed", offset],
    queryFn: () => getHomeFeed({ limit: 20, offset }),
  });
}

export function useMainFeed(offset = 0) {
  return useQuery({
    queryKey: ["mainFeed", offset],
    queryFn: () => getMainFeed({ limit: 20, offset }),
  });
}

export function useHomeFeedLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (answerId: string) => toggleLike(answerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["homeFeed"] }),
  });
}

export function useMainFeedLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (answerId: string) => toggleLike(answerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mainFeed"] });
      qc.invalidateQueries({ queryKey: ["homeFeed"] });
    },
  });
}
