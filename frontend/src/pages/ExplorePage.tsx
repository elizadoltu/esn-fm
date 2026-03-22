import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, UserCircle2, TrendingUp, Lock } from "lucide-react";
import { useSearch, useTrending } from "@/hooks/useSearch";
import { useAuth } from "@/context/useAuth";
import { toggleLike } from "@/api/answers.api";
import { useQueryClient } from "@tanstack/react-query";
import FeedCard from "@/components/FeedCard";
import { Input } from "@/components/ui/input";
import type { FeedItem } from "@/api/answers.api";

export default function ExplorePage() {
  const [q, setQ] = useState("");
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();

  const { data: searchResults, isLoading: searchLoading } = useSearch(q);
  const { data: trending = [], isLoading: trendingLoading } = useTrending();

  function handleLike(answerId: string) {
    toggleLike(answerId).then(() =>
      qc.invalidateQueries({ queryKey: ["trending"] })
    );
  }

  const isSearching = q.trim().length >= 1;

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Explore</h1>

      {/* Search bar */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search people or questions…"
          className="pl-9"
        />
      </div>

      {/* Search results */}
      {isSearching && (
        <div className="space-y-6">
          {searchLoading && (
            <p className="text-center text-sm text-muted-foreground">
              Searching…
            </p>
          )}

          {/* Users */}
          {(searchResults?.users.length ?? 0) > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                People
              </h2>
              <div className="space-y-2">
                {searchResults!.users.map((user) => (
                  <Link
                    key={user.id}
                    to={`/${user.username}`}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:bg-accent transition-colors"
                  >
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.display_name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <UserCircle2 className="h-10 w-10 text-muted-foreground/40" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium truncate">
                          {user.display_name}
                        </p>
                        {user.is_private && (
                          <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        @{user.username}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Answers */}
          {(searchResults?.answers.length ?? 0) > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Q&amp;As
              </h2>
              <div className="space-y-4">
                {searchResults!.answers.map((item) => (
                  <FeedCard
                    key={item.answer_id}
                    item={item as FeedItem}
                    onLike={handleLike}
                    isAuthenticated={isAuthenticated}
                    showAuthor
                  />
                ))}
              </div>
            </section>
          )}

          {!searchLoading &&
            searchResults?.users.length === 0 &&
            searchResults?.answers.length === 0 && (
              <p className="text-center text-sm text-muted-foreground">
                No results for "{q}"
              </p>
            )}
        </div>
      )}

      {/* Trending (when not searching) */}
      {!isSearching && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Trending this week</h2>
          </div>
          {trendingLoading && (
            <p className="text-center text-sm text-muted-foreground">
              Loading…
            </p>
          )}
          <div className="space-y-4">
            {trending.map((item) => (
              <FeedCard
                key={item.answer_id}
                item={item as FeedItem}
                onLike={handleLike}
                isAuthenticated={isAuthenticated}
                showAuthor
              />
            ))}
            {!trendingLoading && trending.length === 0 && (
              <p className="text-center text-sm text-muted-foreground">
                Nothing trending yet. Be the first to ask!
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
