import { useState } from "react";
import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import {
  useHomeFeed,
  useHomeFeedLike,
  useMainFeed,
  useMainFeedLike,
} from "@/hooks/useHomeFeed";
import { useAuth } from "@/context/useAuth";
import FeedCard from "@/components/FeedCard";
import { Button } from "@/components/ui/button";

type FeedTab = "main" | "friends";

const TAB_KEY = "home_feed_tab";

function getInitialTab(): FeedTab {
  const stored = localStorage.getItem(TAB_KEY);
  return stored === "friends" ? "friends" : "main";
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

  function switchTab(t: FeedTab) {
    setTab(t);
    localStorage.setItem(TAB_KEY, t);
  }

  const isLoading = tab === "main" ? mainLoading : friendsLoading;
  const items =
    tab === "main"
      ? (mainFeedData?.items ?? [])
      : (friendsFeedData?.items ?? []);
  const offset = tab === "main" ? mainOffset : friendsOffset;
  const setOffset = tab === "main" ? setMainOffset : setFriendsOffset;
  const like = tab === "main" ? mainLike : friendsLike;

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Home</h1>

      {/* Tabs */}
      <div className="mb-6 flex overflow-hidden rounded-lg border border-border">
        {(["main", "friends"] as FeedTab[]).map((t) => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            {t === "main" ? "Main" : "Friends"}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="py-16 text-center text-muted-foreground">
          Loading feed…
        </div>
      )}

      {/* Friends empty state */}
      {!isLoading && tab === "friends" && items.length === 0 && friendsOffset === 0 && (
        <div className="py-16 text-center">
          <Compass className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
          <h2 className="mb-2 text-xl font-bold">No friends activity yet</h2>
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
          {items.map((item) => (
            <FeedCard
              key={item.answer_id}
              item={item}
              onLike={(id) => like.mutate(id)}
              isAuthenticated={isAuthenticated}
              showAuthor
            />
          ))}
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
    </div>
  );
}
