import client from "./client";
import type { FeedResponse } from "./answers.api";

export async function getHomeFeed(
  params: {
    limit?: number;
    offset?: number;
  } = {}
): Promise<FeedResponse> {
  const res = await client.get<FeedResponse>("/api/feed", { params });
  return res.data;
}

export async function getMainFeed(
  params: {
    limit?: number;
    offset?: number;
  } = {}
): Promise<FeedResponse> {
  const res = await client.get<FeedResponse>("/api/feed/main", { params });
  return res.data;
}
