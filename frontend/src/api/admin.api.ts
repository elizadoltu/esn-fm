import client from "./client";

export interface AdminUser {
  id: string;
  username: string;
  display_name: string;
  email: string;
  avatar_url: string;
  role: "user" | "moderator" | "admin";
  is_private: boolean;
  created_at: string;
  answer_count: number;
}

export interface AdminReport {
  id: string;
  content_type: string;
  content_id: string;
  reason: string;
  status: string;
  created_at: string;
  reporter_username: string;
  reviewer_username: string | null;
  message: string | null;
  content_owner_username: string | null;
  action_type: string | null;
  action_message: string | null;
}

export interface AdminStats {
  users: { total: number; today: number; this_week: number };
  questions: number;
  answers: number;
  reports: { pending: number; total: number };
}

export interface AdminQuestion {
  id: string;
  content: string;
  is_answered: boolean;
  is_anonymous: boolean;
  created_at: string;
  sender_name: string | null;
  recipient: { id: string; username: string; display_name: string };
  real_sender: {
    id: string;
    username: string;
    display_name: string;
    email: string;
  } | null;
}

export interface AuditLog {
  id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  admin_username: string;
  admin_display_name: string;
}

export interface ModerationAlert {
  id: string;
  reference_id: string;
  is_read: boolean;
  created_at: string;
  content_type: string | null;
  reason: string | null;
  report_status: string | null;
  content_id: string | null;
  reporter_username: string | null;
}

export async function getStats(): Promise<AdminStats> {
  const res = await client.get<AdminStats>("/api/admin/stats");
  return res.data;
}

export async function getAdminUsers(params: {
  q?: string;
  role?: string;
  limit?: number;
  offset?: number;
}): Promise<{
  users: AdminUser[];
  total: number;
  limit: number;
  offset: number;
}> {
  const res = await client.get("/api/admin/users", { params });
  return res.data;
}

export async function updateUserRole(
  id: string,
  role: "user" | "moderator" | "admin"
): Promise<void> {
  await client.patch(`/api/admin/users/${id}`, { role });
}

export async function deleteUser(
  id: string,
  reason: string,
  message?: string
): Promise<void> {
  await client.delete(`/api/admin/users/${id}`, { data: { reason, message } });
}

export async function getReports(params: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{
  reports: AdminReport[];
  total: number;
  limit: number;
  offset: number;
}> {
  const res = await client.get("/api/admin/reports", { params });
  return res.data;
}

export async function actionReport(
  id: string,
  status: "reviewed" | "actioned",
  action_type?: string,
  action_message?: string
): Promise<void> {
  await client.patch(`/api/admin/reports/${id}`, {
    status,
    action_type,
    action_message,
  });
}

export async function getAdminQuestions(params: {
  anonymous_only?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{
  questions: AdminQuestion[];
  total: number;
  limit: number;
  offset: number;
}> {
  const res = await client.get("/api/admin/questions", { params });
  return res.data;
}

export async function getAuditLogs(params: {
  limit?: number;
  offset?: number;
}): Promise<{
  logs: AuditLog[];
  total: number;
  limit: number;
  offset: number;
}> {
  const res = await client.get("/api/admin/audit-logs", { params });
  return res.data;
}

export async function getModerationAlerts(): Promise<ModerationAlert[]> {
  const res = await client.get<ModerationAlert[]>(
    "/api/admin/moderation-alerts"
  );
  return res.data;
}

export async function getUnreadModerationAlertCount(): Promise<number> {
  const res = await client.get<{ count: number }>(
    "/api/admin/moderation-alerts/unread-count"
  );
  return res.data.count;
}

export async function markAllModerationAlertsRead(): Promise<void> {
  await client.patch("/api/admin/moderation-alerts/read-all");
}

export async function markModerationAlertRead(id: string): Promise<void> {
  await client.patch(`/api/admin/moderation-alerts/${id}/read`);
}

export async function updateAdminPreferences(prefs: {
  moderation_email_digest: boolean;
}): Promise<void> {
  await client.patch("/api/admin/preferences", prefs);
}
