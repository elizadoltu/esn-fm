import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFeed, toggleLike } from "@/api/answers.api";
import client from "@/api/client";
import type { StoredUser } from "@/lib/auth";

export function useProfile(username: string) {
  return useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
      const res = await client.get<StoredUser>(`/api/users/${username}`);
      return res.data;
    },
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
