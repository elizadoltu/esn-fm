import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, UserCircle2, TrendingUp, Lock, Users } from "lucide-react";
import { useSearch, useTrending, useSuggestions } from "@/hooks/useSearch";
import { useAuth } from "@/context/useAuth";
import { toggleLike, type FeedItem } from "@/api/answers.api";
import { followUser } from "@/api/follows.api";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import FeedCard from "@/components/FeedCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ExplorePage() {
  const [q, setQ] = useState("");
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();

  const [removing, setRemoving] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const { data: searchResults, isLoading: searchLoading } = useSearch(q);
  const { data: trending = [], isLoading: trendingLoading } = useTrending();
  const { data: suggestions = [] } = useSuggestions();

  const visibleSuggestions = suggestions.filter((s) => !dismissed.has(s.id));

  const { mutate: handleLike } = useMutation({
    mutationFn: (answerId: string) => toggleLike(answerId),
    onMutate: async (answerId) => {
      await qc.cancelQueries({ queryKey: ["trending"] });
      const prev = qc.getQueryData<FeedItem[]>(["trending"]);
      qc.setQueryData<FeedItem[]>(["trending"], (old) => {
        if (!old) return old;
        const updated = old.map((item) =>
          item.answer_id === answerId
            ? {
                ...item,
                liked_by_me: !item.liked_by_me,
                likes: item.liked_by_me ? item.likes - 1 : item.likes + 1,
              }
            : item
        );
        // Re-sort by likes descending so liked items bubble up immediately
        return [...updated].sort((a, b) => b.likes - a.likes);
      });
      return { prev };
    },
    onError: (_err, _answerId, context) => {
      if (context?.prev) qc.setQueryData(["trending"], context.prev);
    },
  });

  async function handleFollow(username: string, userId: string) {
    setRemoving((prev) => new Set([...prev, userId]));
    await followUser(username);
    setTimeout(() => {
      setDismissed((prev) => new Set([...prev, userId]));
      setRemoving((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      qc.invalidateQueries({ queryKey: ["suggestions"] });
    }, 300);
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
                    item={item}
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

      {/* Default view (not searching) */}
      {!isSearching && (
        <div className="space-y-8">
          {/* Trending Now */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Trending Now</h2>
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
                  item={item}
                  onLike={handleLike}
                  isAuthenticated={isAuthenticated}
                  showAuthor
                />
              ))}
              {!trendingLoading && trending.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  Nothing trending in the last 24 hours yet. Be the first to
                  answer!
                </p>
              )}
            </div>
          </section>

          {/* People You May Know */}
          {visibleSuggestions.length > 0 && (
            <section>
              <div className="mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">People You May Know</h2>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {visibleSuggestions.map((user) => (
                  <div
                    key={user.id}
                    className={`flex w-40 shrink-0 flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 transition-all duration-300 ${
                      removing.has(user.id)
                        ? "scale-95 opacity-0"
                        : "opacity-100"
                    }`}
                  >
                    <Link
                      to={`/${user.username}`}
                      className="flex flex-col items-center gap-2"
                    >
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.display_name}
                          className="h-14 w-14 rounded-full object-cover"
                        />
                      ) : (
                        <UserCircle2 className="h-14 w-14 text-muted-foreground/40" />
                      )}
                      <div className="text-center">
                        <p className="max-w-full truncate text-sm font-medium">
                          {user.display_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          @{user.username}
                        </p>
                      </div>
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {user.mutual_followers} mutual{" "}
                      {user.mutual_followers === 1 ? "follower" : "followers"}
                    </p>
                    {isAuthenticated && (
                      <Button
                        size="sm"
                        className="w-full text-xs"
                        disabled={removing.has(user.id)}
                        onClick={() => handleFollow(user.username, user.id)}
                      >
                        Follow
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
