import client from "./client";
import type { FeedItem } from "./answers.api";

export interface UserResult {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  is_private: boolean;
}

export interface SearchResults {
  users: UserResult[];
  answers: FeedItem[];
}

export async function search(
  q: string,
  type: "all" | "users" | "answers" = "all"
): Promise<SearchResults> {
  const res = await client.get<SearchResults>("/api/search", {
    params: { q, type },
  });
  return res.data;
}

export async function getTrending(): Promise<FeedItem[]> {
  const res = await client.get<FeedItem[]>("/api/search/trending");
  return res.data;
}
