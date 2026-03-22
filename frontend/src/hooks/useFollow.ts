import { useMutation, useQueryClient } from "@tanstack/react-query";
import { followUser, unfollowUser } from "@/api/follows.api";

export function useFollowToggle(username: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (action: "follow" | "unfollow") =>
      action === "follow" ? followUser(username) : unfollowUser(username),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile", username] });
      qc.invalidateQueries({ queryKey: ["followers", username] });
    },
  });
}
