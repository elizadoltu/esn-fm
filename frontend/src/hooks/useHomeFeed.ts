import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import { getHomeFeed, getMainFeed } from "@/api/feed.api";
import { toggleLike } from "@/api/answers.api";
import type { FeedResponse } from "@/api/answers.api";

export function useHomeFeed() {
  return useInfiniteQuery({
    queryKey: ["homeFeed"],
    queryFn: ({ pageParam }) => getHomeFeed({ limit: 20, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.items.length === 20 ? lastPage.offset + 20 : undefined,
  });
}

export function useMainFeed() {
  return useInfiniteQuery({
    queryKey: ["mainFeed"],
    queryFn: ({ pageParam }) => getMainFeed({ limit: 20, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.items.length === 20 ? lastPage.offset + 20 : undefined,
  });
}

function patchLike(answerId: string) {
  return (
    old: InfiniteData<FeedResponse> | undefined
  ): InfiniteData<FeedResponse> | undefined =>
    old
      ? {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.answer_id === answerId
                ? {
                    ...item,
                    liked_by_me: !item.liked_by_me,
                    likes: item.liked_by_me ? item.likes - 1 : item.likes + 1,
                  }
                : item
            ),
          })),
        }
      : old;
}

export function useHomeFeedLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (answerId: string) => toggleLike(answerId),
    onMutate: async (answerId) => {
      await qc.cancelQueries({ queryKey: ["homeFeed"] });
      const prev = qc.getQueryData<InfiniteData<FeedResponse>>(["homeFeed"]);
      qc.setQueryData<InfiniteData<FeedResponse>>(
        ["homeFeed"],
        patchLike(answerId)
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["homeFeed"], ctx.prev);
    },
  });
}

export function useMainFeedLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (answerId: string) => toggleLike(answerId),
    onMutate: async (answerId) => {
      await qc.cancelQueries({ queryKey: ["mainFeed"] });
      await qc.cancelQueries({ queryKey: ["homeFeed"] });
      const prevMain = qc.getQueryData<InfiniteData<FeedResponse>>([
        "mainFeed",
      ]);
      const prevHome = qc.getQueryData<InfiniteData<FeedResponse>>([
        "homeFeed",
      ]);
      qc.setQueryData<InfiniteData<FeedResponse>>(
        ["mainFeed"],
        patchLike(answerId)
      );
      qc.setQueryData<InfiniteData<FeedResponse>>(
        ["homeFeed"],
        patchLike(answerId)
      );
      return { prevMain, prevHome };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prevMain) qc.setQueryData(["mainFeed"], ctx.prevMain);
      if (ctx?.prevHome) qc.setQueryData(["homeFeed"], ctx.prevHome);
    },
  });
}
