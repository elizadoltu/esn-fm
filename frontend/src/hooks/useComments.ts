import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getComments,
  postComment,
  deleteComment,
  likeComment,
} from "@/api/comments.api";
import type { FeedItem } from "@/api/answers.api";

type FeedPage = { items: FeedItem[] };

function patchCount(answerId: string, delta: 1 | -1) {
  return (old: FeedPage | undefined): FeedPage | undefined =>
    old
      ? {
          ...old,
          items: old.items.map((item) =>
            item.answer_id === answerId
              ? {
                  ...item,
                  comment_count: Math.max(0, item.comment_count + delta),
                }
              : item
          ),
        }
      : old;
}

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
    onMutate: async () => {
      // Optimistically bump comment_count in every feed cache
      qc.setQueriesData<FeedPage>(
        { queryKey: ["mainFeed"] },
        patchCount(answerId, 1)
      );
      qc.setQueriesData<FeedPage>(
        { queryKey: ["homeFeed"] },
        patchCount(answerId, 1)
      );
      // Trending is FeedItem[] directly (no wrapper)
      qc.setQueriesData<FeedItem[]>({ queryKey: ["trending"] }, (old) =>
        old?.map((item) =>
          item.answer_id === answerId
            ? { ...item, comment_count: item.comment_count + 1 }
            : item
        )
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", answerId] });
      if (profileUsername) {
        qc.invalidateQueries({ queryKey: ["feed", profileUsername] });
      }
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: ["mainFeed"] });
      qc.invalidateQueries({ queryKey: ["homeFeed"] });
      qc.invalidateQueries({ queryKey: ["trending"] });
    },
  });
}

export function useDeleteComment(answerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteComment,
    onMutate: async () => {
      qc.setQueriesData<FeedPage>(
        { queryKey: ["mainFeed"] },
        patchCount(answerId, -1)
      );
      qc.setQueriesData<FeedPage>(
        { queryKey: ["homeFeed"] },
        patchCount(answerId, -1)
      );
      qc.setQueriesData<FeedItem[]>({ queryKey: ["trending"] }, (old) =>
        old?.map((item) =>
          item.answer_id === answerId
            ? { ...item, comment_count: Math.max(0, item.comment_count - 1) }
            : item
        )
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", answerId] });
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: ["mainFeed"] });
      qc.invalidateQueries({ queryKey: ["homeFeed"] });
      qc.invalidateQueries({ queryKey: ["trending"] });
    },
  });
}

export function useLikeComment(answerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: likeComment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", answerId] });
    },
  });
}
