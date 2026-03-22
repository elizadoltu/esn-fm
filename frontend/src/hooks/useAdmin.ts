import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getStats,
  getAdminUsers,
  updateUserRole,
  getReports,
  actionReport,
} from "@/api/admin.api";

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
    mutationFn: ({ id, role }: { id: string; role: "user" | "moderator" | "admin" }) =>
      updateUserRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
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
    mutationFn: ({ id, status }: { id: string; status: "reviewed" | "actioned" }) =>
      actionReport(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "reports"] }),
  });
}
