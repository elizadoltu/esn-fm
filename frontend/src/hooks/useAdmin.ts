import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getStats,
  getAdminUsers,
  updateUserRole,
  getReports,
  actionReport,
  getAdminQuestions,
  getAuditLogs,
  getModerationAlerts,
  getUnreadModerationAlertCount,
  markAllModerationAlertsRead,
  markModerationAlertRead,
  deleteUser,
  updateAdminPreferences,
} from "@/api/admin.api";
import { getToken } from "@/lib/auth";

export function useAdminStats() {
  return useQuery({ queryKey: ["admin", "stats"], queryFn: getStats });
}

export function useAdminUsers(params: {
  q?: string;
  role?: string;
  offset?: number;
}) {
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => getAdminUsers({ limit: 20, ...params }),
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      role,
    }: {
      id: string;
      role: "user" | "moderator" | "admin";
    }) => updateUserRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      reason,
      message,
    }: {
      id: string;
      reason: string;
      message?: string;
    }) => deleteUser(id, reason, message),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
}

export function useAdminReports(params: { status?: string; offset?: number }) {
  return useQuery({
    queryKey: ["admin", "reports", params],
    queryFn: () => getReports({ limit: 20, ...params }),
  });
}

export function useActionReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      action_type,
      action_message,
    }: {
      id: string;
      status: "reviewed" | "actioned";
      action_type?: string;
      action_message?: string;
    }) => actionReport(id, status, action_type, action_message),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "reports"] }),
  });
}

export function useAdminQuestions(params: {
  anonymous_only?: boolean;
  offset?: number;
}) {
  return useQuery({
    queryKey: ["admin", "questions", params],
    queryFn: () => getAdminQuestions({ limit: 20, ...params }),
  });
}

export function useAuditLogs(params: { offset?: number }) {
  return useQuery({
    queryKey: ["admin", "audit-logs", params],
    queryFn: () => getAuditLogs({ limit: 20, ...params }),
  });
}

export function useModerationAlerts() {
  const enabled = !!getToken();
  return useQuery({
    queryKey: ["admin", "moderation-alerts"],
    queryFn: getModerationAlerts,
    enabled,
    refetchInterval: enabled ? 60_000 : false,
  });
}

export function useUnreadModerationAlertCount() {
  const enabled = !!getToken();
  return useQuery({
    queryKey: ["admin", "moderation-alerts", "unread-count"],
    queryFn: getUnreadModerationAlertCount,
    enabled,
    refetchInterval: enabled ? 60_000 : false,
  });
}

export function useMarkAllModerationAlertsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllModerationAlertsRead,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin", "moderation-alerts"] }),
  });
}

export function useMarkModerationAlertRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markModerationAlertRead(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin", "moderation-alerts"] }),
  });
}

export function useUpdateAdminPreferences() {
  return useMutation({
    mutationFn: (prefs: { moderation_email_digest: boolean }) =>
      updateAdminPreferences(prefs),
  });
}
