import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getHomeFeed } from "@/api/feed.api";
import { toggleLike } from "@/api/answers.api";

export function useHomeFeed(offset = 0) {
  return useQuery({
    queryKey: ["homeFeed", offset],
    queryFn: () => getHomeFeed({ limit: 20, offset }),
  });
}

export function useHomeFeedLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (answerId: string) => toggleLike(answerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["homeFeed"] }),
  });
}
