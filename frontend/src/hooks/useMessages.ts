import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getConversations,
  getMessages,
  sendDm,
  getUnreadDmCount,
  markConversationRead,
} from "@/api/dm.api";
import { getToken } from "@/lib/auth";

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: getConversations,
  });
}

export function useMessages(username: string) {
  return useQuery({
    queryKey: ["messages", username],
    queryFn: () => getMessages(username),
    enabled: !!username,
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

export function useUnreadDmCount() {
  const enabled = !!getToken();
  return useQuery({
    queryKey: ["dm", "unread-count"],
    queryFn: getUnreadDmCount,
    enabled,
    refetchInterval: enabled ? 30_000 : false,
  });
}

export function useMarkConversationRead(username: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markConversationRead(username),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dm", "unread-count"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
