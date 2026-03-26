import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import {
  getComments,
  postComment,
  deleteComment,
  likeComment,
} from "@/api/comments.api";
import type { Comment } from "@/api/comments.api";
import type { FeedItem } from "@/api/answers.api";

type FeedPage = { items: FeedItem[] };

function patchInfiniteCount(answerId: string, delta: 1 | -1) {
  return (
    old: InfiniteData<FeedPage> | undefined
  ): InfiniteData<FeedPage> | undefined =>
    old
      ? {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.answer_id === answerId
                ? {
                    ...item,
                    comment_count: Math.max(0, item.comment_count + delta),
                  }
                : item
            ),
          })),
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
      qc.setQueriesData<InfiniteData<FeedPage>>(
        { queryKey: ["mainFeed"] },
        patchInfiniteCount(answerId, 1)
      );
      qc.setQueriesData<InfiniteData<FeedPage>>(
        { queryKey: ["homeFeed"] },
        patchInfiniteCount(answerId, 1)
      );
      // Trending is FeedItem[] directly (not infinite)
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
      qc.setQueriesData<InfiniteData<FeedPage>>(
        { queryKey: ["mainFeed"] },
        patchInfiniteCount(answerId, -1)
      );
      qc.setQueriesData<InfiniteData<FeedPage>>(
        { queryKey: ["homeFeed"] },
        patchInfiniteCount(answerId, -1)
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

function toggleInTree(comments: Comment[], commentId: string): Comment[] {
  return comments.map((c) =>
    c.id === commentId
      ? {
          ...c,
          liked_by_me: !c.liked_by_me,
          like_count: c.liked_by_me ? c.like_count - 1 : c.like_count + 1,
        }
      : { ...c, replies: toggleInTree(c.replies, commentId) }
  );
}

export function useLikeComment(answerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: likeComment,
    onMutate: async (commentId) => {
      await qc.cancelQueries({ queryKey: ["comments", answerId] });
      const prev = qc.getQueryData<Comment[]>(["comments", answerId]);
      qc.setQueryData<Comment[]>(["comments", answerId], (old) =>
        old ? toggleInTree(old, commentId) : old
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      qc.setQueryData(["comments", answerId], ctx?.prev);
    },
  });
}
