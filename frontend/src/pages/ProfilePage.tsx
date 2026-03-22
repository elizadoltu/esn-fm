import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { UserCircle2, MapPin, Globe, Users, Mail, X, Lock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useProfile, useFeed, useLike } from "@/hooks/useProfile";
import { useFollowToggle } from "@/hooks/useFollow";
import { getFollowers, getFollowing, type FollowUser } from "@/api/follows.api";
import { useAuth } from "@/context/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import FeedCard from "@/components/FeedCard";

type ModalTab = "followers" | "following";

function FollowModal({
  username,
  tab,
  onClose,
  onTabChange,
}: Readonly<{
  username: string;
  tab: ModalTab;
  onClose: () => void;
  onTabChange: (t: ModalTab) => void;
}>) {
  const { data: followers = [], isLoading: loadingFollowers } = useQuery({
    queryKey: ["followers", username],
    queryFn: () => getFollowers(username),
  });
  const { data: following = [], isLoading: loadingFollowing } = useQuery({
    queryKey: ["following", username],
    queryFn: () => getFollowing(username),
  });

  const list: FollowUser[] = tab === "followers" ? followers : following;
  const isLoading = tab === "followers" ? loadingFollowers : loadingFollowing;

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        className="fixed inset-0 z-40 w-full bg-black/60"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex gap-1">
            {(["followers", "following"] as ModalTab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onTabChange(t)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                  tab === t
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {isLoading && (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
          )}
          {!isLoading && list.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No {tab} yet
            </p>
          )}
          {list.map((u) => (
            <Link
              key={u.id}
              to={`/${u.username}`}
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-accent transition-colors"
            >
              {u.avatar_url ? (
                <img
                  src={u.avatar_url}
                  alt={u.display_name}
                  className="h-9 w-9 rounded-full object-cover shrink-0"
                />
              ) : (
                <UserCircle2 className="h-9 w-9 shrink-0 text-muted-foreground/40" />
              )}
              <div className="min-w-0">
                <p className="font-medium truncate">{u.display_name}</p>
                <p className="text-xs text-muted-foreground">@{u.username}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: me, isAuthenticated } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(username ?? "");
  const { data: feedData, isLoading: feedLoading } = useFeed(username ?? "");
  const like = useLike(username ?? "");
  const followToggle = useFollowToggle(username ?? "");
  const [followModal, setFollowModal] = useState<ModalTab | null>(null);

  if (profileLoading) {
    return <div className="py-16 text-center text-muted-foreground">Loading…</div>;
  }

  if (!profile) {
    return <div className="py-16 text-center text-destructive">User not found.</div>;
  }

  const isOwner = me?.username === username;
  let followLabel = "Follow";
  if (profile.is_following) followLabel = "Unfollow";
  else if (profile.is_pending) followLabel = "Requested";

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      {/* Cover image */}
      {profile.cover_image_url && (
        <div className="mb-0 -mx-4 h-32 overflow-hidden rounded-t-lg sm:mx-0">
          <img src={profile.cover_image_url} alt="Cover" className="h-full w-full object-cover" />
        </div>
      )}

      {/* Profile header */}
      <Card className={profile.cover_image_url ? "rounded-t-none" : ""}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="h-16 w-16 rounded-full object-cover ring-2 ring-border"
              />
            ) : (
              <UserCircle2 className="h-16 w-16 text-muted-foreground/40" />
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold">{profile.display_name}</h1>
                {profile.role !== "user" && (
                  <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary capitalize">
                    {profile.role}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
              {profile.bio && <p className="mt-2 text-sm">{profile.bio}</p>}

              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {profile.location}
                  </span>
                )}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary"
                  >
                    <Globe className="h-3 w-3" />
                    {profile.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
              </div>

              {/* Clickable counts */}
              <div className="mt-3 flex gap-4 text-sm">
                <button
                  type="button"
                  onClick={() => setFollowModal("followers")}
                  className="hover:underline text-left"
                >
                  <strong className="text-foreground">{profile.follower_count}</strong>{" "}
                  <span className="text-muted-foreground">followers</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFollowModal("following")}
                  className="hover:underline text-left"
                >
                  <strong className="text-foreground">{profile.following_count}</strong>{" "}
                  <span className="text-muted-foreground">following</span>
                </button>
                <span>
                  <strong className="text-foreground">{profile.answer_count}</strong>{" "}
                  <span className="text-muted-foreground">answers</span>
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex gap-2 flex-wrap">
            {isOwner ? (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/inbox">View inbox</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/settings">Edit profile</Link>
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" asChild>
                  <Link to={`/ask/${username}`}>Ask a question</Link>
                </Button>
                {isAuthenticated && (
                  <>
                    <Button
                      variant={profile.is_following || profile.is_pending ? "outline" : "secondary"}
                      size="sm"
                      onClick={() => followToggle.mutate(profile.is_following || profile.is_pending ? "unfollow" : "follow")}
                      disabled={followToggle.isPending}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      {followLabel}
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/messages/${username}`}>
                        <Mail className="h-4 w-4 mr-1" />
                        Message
                      </Link>
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Followers / Following modal */}
      {followModal && username && (
        <FollowModal
          username={username}
          tab={followModal}
          onClose={() => setFollowModal(null)}
          onTabChange={setFollowModal}
        />
      )}

      {/* Feed */}
      <div className="mt-6">
        {profile.is_private && !isOwner && !profile.is_following ? (
          <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
            <Lock className="h-10 w-10 opacity-30" />
            <p className="font-medium text-foreground">This account is private</p>
            <p className="text-sm text-center">
              Follow this account to see their answers.
            </p>
          </div>
        ) : null}

        {(!profile.is_private || isOwner || profile.is_following) && (
          feedLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading feed…</div>
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
          )
        )}
      </div>
    </div>
  );
}
