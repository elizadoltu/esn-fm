import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getInbox, deleteQuestion } from "@/api/questions.api";
import { postAnswer } from "@/api/answers.api";

export function useInbox() {
  return useQuery({
    queryKey: ["inbox"],
    queryFn: getInbox,
  });
}

export function useDeleteQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteQuestion,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inbox"] }),
  });
}

export function usePostAnswer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: postAnswer,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inbox"] }),
  });
}
