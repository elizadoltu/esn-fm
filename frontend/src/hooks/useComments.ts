import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getComments, postComment, deleteComment } from "@/api/comments.api";

export function useComments(answerId: string) {
  return useQuery({
    queryKey: ["comments", answerId],
    queryFn: () => getComments(answerId),
    enabled: !!answerId,
  });
}

export function usePostComment(answerId: string, profileUsername?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: postComment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", answerId] });
      if (profileUsername) {
        qc.invalidateQueries({ queryKey: ["feed", profileUsername] });
      }
      qc.invalidateQueries({ queryKey: ["homeFeed"] });
    },
  });
}

export function useDeleteComment(answerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", answerId] });
    },
  });
}
