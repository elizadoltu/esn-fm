import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getActiveDailyQuestion,
  getDailyQAnswers,
  getDailyQArchive,
  getDailyQById,
  getDailyQAnswersById,
  getUserDailyQAnswers,
  submitDailyQAnswer,
  toggleDailyQLike,
  type DailyQAnswer,
} from "@/api/dailyQuestion.api";

export function useDailyQuestion() {
  return useQuery({
    queryKey: ["dailyQuestion"],
    queryFn: getActiveDailyQuestion,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDailyQAnswers(questionId: string | undefined) {
  return useQuery({
    queryKey: ["dailyQAnswers", questionId],
    queryFn: () => getDailyQAnswers(),
    enabled: !!questionId,
    select: (data) => data.items,
  });
}

export function useSubmitDailyQAnswer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      questionId,
      content,
      showOnFeed,
    }: {
      questionId: string;
      content: string;
      showOnFeed: boolean;
    }) => submitDailyQAnswer(questionId, { content, show_on_feed: showOnFeed }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dailyQuestion"] });
      qc.invalidateQueries({ queryKey: ["dailyQAnswers"] });
      qc.invalidateQueries({ queryKey: ["userDailyQAnswers"] });
    },
  });
}

export function useDailyQArchive(offset = 0) {
  return useQuery({
    queryKey: ["dailyQArchive", offset],
    queryFn: () => getDailyQArchive({ limit: 20, offset }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDailyQDetail(id = "") {
  return useQuery({
    queryKey: ["dailyQDetail", id],
    queryFn: () => getDailyQById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDailyQAnswersById(id = "", offset = 0) {
  return useQuery({
    queryKey: ["dailyQAnswersById", id, offset],
    queryFn: () => getDailyQAnswersById(id, { limit: 20, offset }),
    enabled: !!id,
    select: (data) => data,
  });
}

export function useUserDailyQAnswers(username: string) {
  return useQuery({
    queryKey: ["userDailyQAnswers", username],
    queryFn: () => getUserDailyQAnswers(username),
    enabled: !!username,
    staleTime: 2 * 60 * 1000,
  });
}

export function useDailyQLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (answerId: string) => toggleDailyQLike(answerId),
    onMutate: async (answerId) => {
      await qc.cancelQueries({ queryKey: ["dailyQAnswers"] });
      const prev = qc.getQueryData<DailyQAnswer[]>(["dailyQAnswers"]);
      qc.setQueryData<DailyQAnswer[]>(["dailyQAnswers"], (old) =>
        old?.map((item) =>
          item.id === answerId
            ? {
                ...item,
                liked_by_me: !item.liked_by_me,
                likes: item.liked_by_me ? item.likes - 1 : item.likes + 1,
              }
            : item
        )
      );
      return { prev };
    },
    onError: (_err, _id, context) => {
      if (context?.prev) qc.setQueryData(["dailyQAnswers"], context.prev);
    },
  });
}
