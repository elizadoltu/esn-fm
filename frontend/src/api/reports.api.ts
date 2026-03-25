import client from "./client";

export type ContentType = "question" | "answer" | "comment" | "user";
export type ReportReason =
  | "spam"
  | "harassment"
  | "hate_speech"
  | "inappropriate"
  | "other";

export async function submitReport(data: {
  content_type: ContentType;
  content_id: string;
  reason: ReportReason;
  message?: string;
}): Promise<void> {
  await client.post("/api/reports", data);
}
