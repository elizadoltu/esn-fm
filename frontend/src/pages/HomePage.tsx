import { useState } from "react";
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

function getInitialTab(): FeedTab {
  const stored = localStorage.getItem(TAB_KEY);
  if (stored === "friends" || stored === "daily") return stored;
  return "main";
}

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState<FeedTab>(getInitialTab);
  const [mainOffset, setMainOffset] = useState(0);
  const [friendsOffset, setFriendsOffset] = useState(0);

  const { data: mainFeedData, isLoading: mainLoading } =
    useMainFeed(mainOffset);
  const { data: friendsFeedData, isLoading: friendsLoading } =
    useHomeFeed(friendsOffset);
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

  let isLoading = false;
  let items: FeedItem[] = [];
  let offset = 0;
  let setOffset: (fn: (o: number) => number) => void = setMainOffset;
  let like = mainLike;

  if (tab === "main") {
    isLoading = mainLoading;
    items = mainFeedData?.items ?? [];
    offset = mainOffset;
    setOffset = setMainOffset;
    like = mainLike;
  } else if (tab === "friends") {
    isLoading = friendsLoading;
    items = friendsFeedData?.items ?? [];
    offset = friendsOffset;
    setOffset = setFriendsOffset;
    like = friendsLike;
  }

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
            {t === "main" ? "Main" : t === "friends" ? "Friends" : "Daily Q"}
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
          {/* Loading */}
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <FeedCardSkeleton key={n} showAuthor />
              ))}
            </div>
          )}

          {/* Friends empty state */}
          {!isLoading &&
            tab === "friends" &&
            items.length === 0 &&
            friendsOffset === 0 && (
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

          {/* Feed items — Friends tab groups consecutive same-user cards */}
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
                      onLike={(id) => like.mutate(id)}
                      isAuthenticated={isAuthenticated}
                      showAuthor
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && (
            <div className="mt-6 flex justify-center gap-3">
              {offset > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOffset((o) => Math.max(0, o - 20))}
                >
                  Previous
                </Button>
              )}
              {items.length === 20 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOffset((o) => o + 20)}
                >
                  Load more
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
