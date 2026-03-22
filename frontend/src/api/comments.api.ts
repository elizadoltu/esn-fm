import client from "./client";

export interface CommentAuthor {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export interface Comment {
  id: string;
  answer_id: string;
  parent_comment_id: string | null;
  content: string;
  is_deleted: boolean;
  created_at: string;
  author: CommentAuthor;
  replies: Comment[];
}

export async function getComments(answerId: string): Promise<Comment[]> {
  const res = await client.get<Comment[]>(`/api/comments/${answerId}`);
  return res.data;
}

export async function postComment(data: {
  answer_id: string;
  content: string;
  parent_comment_id?: string;
}): Promise<Comment> {
  const res = await client.post<Comment>("/api/comments", data);
  return res.data;
}

export async function deleteComment(id: string): Promise<void> {
  await client.delete(`/api/comments/${id}`);
}
