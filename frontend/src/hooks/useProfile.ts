import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import { getFeed, toggleLike } from "@/api/answers.api";
import type { FeedResponse } from "@/api/answers.api";
import { getProfile } from "@/api/users.api";

export function useProfile(username: string) {
  return useQuery({
    queryKey: ["profile", username],
    queryFn: () => getProfile(username),
    enabled: !!username,
  });
}

export function useFeed(username: string) {
  return useInfiniteQuery({
    queryKey: ["feed", username],
    queryFn: ({ pageParam }) =>
      getFeed(username, { limit: 20, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.items.length === 20 ? lastPage.offset + 20 : undefined,
    enabled: !!username,
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

export function useLike(username: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (answerId: string) => toggleLike(answerId),
    onMutate: async (answerId) => {
      await qc.cancelQueries({ queryKey: ["feed", username] });
      const prev = qc.getQueryData<InfiniteData<FeedResponse>>(["feed", username]);
      qc.setQueryData<InfiniteData<FeedResponse>>(["feed", username], patchLike(answerId));
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["feed", username], ctx.prev);
    },
  });
}
