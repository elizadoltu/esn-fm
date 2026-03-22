import { useParams } from "react-router-dom";
import { UserCircle2 } from "lucide-react";
import { useProfile, useFeed, useLike } from "@/hooks/useProfile";
import { useAuth } from "@/context/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import FeedCard from "@/components/FeedCard";

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: me, isAuthenticated } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(
    username ?? ""
  );
  const { data: feedData, isLoading: feedLoading } = useFeed(username ?? "");
  const like = useLike(username ?? "");

  if (profileLoading) {
    return (
      <div className="py-16 text-center text-muted-foreground">Loading…</div>
    );
  }

  if (!profile) {
    return (
      <div className="py-16 text-center text-destructive">User not found.</div>
    );
  }

  const isOwner = me?.username === username;

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      {/* Profile header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <UserCircle2 className="h-16 w-16 text-muted-foreground/40" />
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold">{profile.display_name}</h1>
              <p className="text-sm text-muted-foreground">
                @{profile.username}
              </p>
              {profile.bio && <p className="mt-2 text-sm">{profile.bio}</p>}
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            {!isOwner && (
              <Button size="sm" asChild>
                <a href={`/ask/${username}`}>Ask a question</a>
              </Button>
            )}
            {isOwner && (
              <Button variant="outline" size="sm" asChild>
                <a href="/inbox">View inbox</a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feed */}
      {feedLoading ? (
        <div className="py-8 text-center text-muted-foreground">
          Loading feed…
        </div>
      ) : (
        <div className="space-y-4">
          {feedData?.items.map((item) => (
            <FeedCard
              key={item.answer_id}
              item={item}
              onLike={(id) => like.mutate(id)}
              isAuthenticated={isAuthenticated}
            />
          ))}
          {feedData?.items.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">
              No answered questions yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
