import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import {
  useHomeFeed,
  useHomeFeedLike,
  useMainFeed,
  useMainFeedLike,
} from "@/hooks/useHomeFeed";
import {
  useDailyQuestion,
  useDailyQAnswers,
  useDailyQLike,
} from "@/hooks/useDailyQuestion";
import { useAuth } from "@/context/useAuth";
import FeedCard from "@/components/FeedCard";
import FeedCardSkeleton from "@/components/FeedCardSkeleton";
import DailyQTab from "@/features/dailyQ/DailyQTab";
import { Button } from "@/components/ui/button";
import type { FeedItem } from "@/api/answers.api";

type FeedTab = "main" | "friends" | "daily";

const TAB_KEY = "home_feed_tab";

const TAB_LABELS: Record<FeedTab, string> = {
  main: "Main",
  friends: "Friends",
  daily: "Daily Q",
};

function getInitialTab(): FeedTab {
  const stored = localStorage.getItem(TAB_KEY);
  if (stored === "friends" || stored === "daily") return stored;
  return "main";
}

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState<FeedTab>(getInitialTab);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const {
    data: mainFeedData,
    isLoading: mainLoading,
    fetchNextPage: fetchNextMain,
    hasNextPage: hasNextMain,
    isFetchingNextPage: fetchingNextMain,
  } = useMainFeed();

  const {
    data: friendsFeedData,
    isLoading: friendsLoading,
    fetchNextPage: fetchNextFriends,
    hasNextPage: hasNextFriends,
    isFetchingNextPage: fetchingNextFriends,
  } = useHomeFeed();

  const mainLike = useMainFeedLike();
  const friendsLike = useHomeFeedLike();

  const { data: dailyQ, isLoading: dailyQLoading } = useDailyQuestion();
  const { data: dailyAnswers = [], isLoading: dailyAnswersLoading } =
    useDailyQAnswers(dailyQ?.id);
  const dailyLike = useDailyQLike();

  function switchTab(t: FeedTab) {
    setTab(t);
    localStorage.setItem(TAB_KEY, t);
  }

  const isMain = tab === "main";
  const isLoading = isMain ? mainLoading : friendsLoading;
  const items: FeedItem[] = isMain
    ? (mainFeedData?.pages.flatMap((p) => p.items) ?? [])
    : (friendsFeedData?.pages.flatMap((p) => p.items) ?? []);
  const hasNextPage = isMain ? hasNextMain : hasNextFriends;
  const isFetchingNextPage = isMain ? fetchingNextMain : fetchingNextFriends;
  const fetchNextPage = isMain ? fetchNextMain : fetchNextFriends;
  const likeMutate = isMain ? mainLike.mutate : friendsLike.mutate;

  // Infinite scroll: load next page when sentinel enters viewport
  useEffect(() => {
    if (!sentinelRef.current || tab === "daily") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [tab, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Home</h1>

      {/* Tabs */}
      <div className="mb-6 flex overflow-hidden rounded-lg border border-border">
        {(["main", "friends", "daily"] as FeedTab[]).map((t) => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Daily Q tab */}
      {tab === "daily" && (
        <DailyQTab
          dailyQ={dailyQ ?? null}
          answers={dailyAnswers}
          isLoading={dailyQLoading || dailyAnswersLoading}
          onLike={(id: string) => dailyLike.mutate(id)}
          isAuthenticated={isAuthenticated}
        />
      )}

      {/* Main / Friends tabs */}
      {tab !== "daily" && (
        <>
          {/* Initial loading skeletons */}
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <FeedCardSkeleton key={n} showAuthor />
              ))}
            </div>
          )}

          {/* Friends empty state */}
          {!isLoading && tab === "friends" && items.length === 0 && (
            <div className="py-16 text-center">
              <Compass className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
              <h2 className="mb-2 text-xl font-bold">
                No friends activity yet
              </h2>
              <p className="mb-6 text-sm text-muted-foreground">
                Follow people to see their Q&amp;As here.
              </p>
              <Button asChild>
                <Link to="/explore">Discover people</Link>
              </Button>
            </div>
          )}

          {/* Feed items */}
          {!isLoading && items.length > 0 && (
            <div className="space-y-4">
              {items.map((item, idx) => {
                const prevItem = idx > 0 ? items[idx - 1] : null;
                const sameUserAsPrev =
                  tab === "friends" &&
                  prevItem !== null &&
                  prevItem.author_username === item.author_username;
                return (
                  <div key={item.answer_id}>
                    {sameUserAsPrev && (
                      <div className="mb-4 flex items-center gap-2">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-xs text-muted-foreground">
                          more from @{item.author_username}
                        </span>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                    )}
                    <FeedCard
                      item={item}
                      onLike={(id) => likeMutate(id)}
                      isAuthenticated={isAuthenticated}
                      showAuthor
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Infinite scroll sentinel + spinner */}
          <div ref={sentinelRef} className="h-4" />
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
