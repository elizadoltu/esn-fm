import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  getUnreadCount,
  markAllRead,
  markRead,
} from "@/api/notifications.api";
import { getToken } from "@/lib/auth";

export function useNotifications() {
  const enabled = !!getToken();
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotifications(),
    enabled,
    refetchInterval: enabled ? 30_000 : false,
  });
}

export function useUnreadCount() {
  const enabled = !!getToken();
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: getUnreadCount,
    enabled,
    refetchInterval: enabled ? 30_000 : false,
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
