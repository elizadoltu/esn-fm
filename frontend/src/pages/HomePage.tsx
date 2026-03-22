import { useState } from "react";
import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { useHomeFeed, useHomeFeedLike } from "@/hooks/useHomeFeed";
import { useAuth } from "@/context/useAuth";
import FeedCard from "@/components/FeedCard";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [offset, setOffset] = useState(0);
  const { data: feedData, isLoading } = useHomeFeed(offset);
  const like = useHomeFeedLike();

  if (isLoading) {
    return <div className="py-16 text-center text-muted-foreground">Loading feed…</div>;
  }

  const items = feedData?.items ?? [];

  if (items.length === 0 && offset === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <Compass className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
        <h2 className="mb-2 text-xl font-bold">Your feed is empty</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Follow people to see their Q&amp;As here.
        </p>
        <Button asChild>
          <Link to="/explore">Explore people</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Home</h1>

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
    </div>
  );
}
