import { useMutation, useQueryClient } from "@tanstack/react-query";
import { followUser, unfollowUser } from "@/api/follows.api";

export function useFollowToggle(username: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (action: "follow" | "unfollow") => {
      if (action === "follow") await followUser(username);
      else await unfollowUser(username);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile", username] });
      qc.invalidateQueries({ queryKey: ["followers", username] });
    },
  });
}
