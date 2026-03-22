import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFeed, toggleLike } from "@/api/answers.api";
import { getProfile } from "@/api/users.api";

export function useProfile(username: string) {
  return useQuery({
    queryKey: ["profile", username],
    queryFn: () => getProfile(username),
    enabled: !!username,
  });
}

export function useFeed(username: string, offset = 0) {
  return useQuery({
    queryKey: ["feed", username, offset],
    queryFn: () => getFeed(username, { limit: 20, offset }),
    enabled: !!username,
  });
}

export function useLike(username: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (answerId: string) => toggleLike(answerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed", username] }),
  });
}
