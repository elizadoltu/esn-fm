import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getConversations, getMessages, sendDm } from "@/api/dm.api";

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: getConversations,
    refetchInterval: 15_000,
  });
}

export function useMessages(username: string) {
  return useQuery({
    queryKey: ["messages", username],
    queryFn: () => getMessages(username),
    enabled: !!username,
    refetchInterval: 10_000,
  });
}

export function useSendDm(username: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sendDm,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages", username] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
