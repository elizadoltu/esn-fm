import { Link } from "react-router-dom";
import { UserCircle2, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getFollowers, getFollowing, type FollowUser } from "@/api/follows.api";
import { useAuth } from "@/context/useAuth";
import { useUnfollowInModal, useRemoveFollower } from "@/hooks/useFollow";

export type ModalTab = "followers" | "following";

interface FollowModalProps {
  username: string;
  tab: ModalTab;
  onClose: () => void;
  onTabChange: (t: ModalTab) => void;
}

export default function FollowModal({
  username,
  tab,
  onClose,
  onTabChange,
}: Readonly<FollowModalProps>) {
  const { user: me } = useAuth();
  const isOwner = me?.username === username;

  const { data: followers = [], isLoading: loadingFollowers } = useQuery({
    queryKey: ["followers", username],
    queryFn: () => getFollowers(username),
  });
  const { data: following = [], isLoading: loadingFollowing } = useQuery({
    queryKey: ["following", username],
    queryFn: () => getFollowing(username),
  });

  const unfollowInModal = useUnfollowInModal(username);
  const removeFollower = useRemoveFollower(username);

  const list: FollowUser[] = tab === "followers" ? followers : following;
  const isLoading = tab === "followers" ? loadingFollowers : loadingFollowing;

  return (
    <>
      <button
        type="button"
        aria-label="Close"
        className="fixed inset-0 z-40 w-full bg-black/60"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card shadow-xl">
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

        <div className="max-h-80 overflow-y-auto p-2">
          {isLoading && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading…
            </p>
          )}
          {!isLoading && list.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No {tab} yet
            </p>
          )}
          {list.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-accent transition-colors"
            >
              <Link
                to={`/${u.username}`}
                onClick={onClose}
                className="flex items-center gap-3 flex-1 min-w-0"
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

              {isOwner && tab === "following" && (
                <button
                  type="button"
                  onClick={() => unfollowInModal.mutate(u.username)}
                  disabled={unfollowInModal.isPending}
                  className="shrink-0 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-destructive hover:text-destructive transition-colors disabled:opacity-50"
                >
                  Unfollow
                </button>
              )}

              {isOwner && tab === "followers" && (
                <button
                  type="button"
                  onClick={() => removeFollower.mutate(u.username)}
                  disabled={removeFollower.isPending}
                  className="shrink-0 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-destructive hover:text-destructive transition-colors disabled:opacity-50"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
