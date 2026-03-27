import { useMutation, useQueryClient } from "@tanstack/react-query";
import { followUser, unfollowUser, removeFollower } from "@/api/follows.api";

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
      qc.invalidateQueries({ queryKey: ["following", username] });
    },
  });
}

export function useUnfollowInModal(profileUsername: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (targetUsername: string) => unfollowUser(targetUsername),
    onSuccess: (_data, targetUsername) => {
      qc.setQueryData<{ id: string; username: string }[]>(
        ["following", profileUsername],
        (old) => old?.filter((u) => u.username !== targetUsername)
      );
      qc.invalidateQueries({ queryKey: ["profile", profileUsername] });
    },
  });
}

export function useRemoveFollower(profileUsername: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (followerUsername: string) => removeFollower(followerUsername),
    onSuccess: (_data, followerUsername) => {
      qc.setQueryData<{ id: string; username: string }[]>(
        ["followers", profileUsername],
        (old) => old?.filter((u) => u.username !== followerUsername)
      );
      qc.invalidateQueries({ queryKey: ["profile", profileUsername] });
    },
  });
}
