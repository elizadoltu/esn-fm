import { useState, useRef, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import {
  UserCircle2,
  MapPin,
  Globe,
  Users,
  Mail,
  Lock,
  Loader2,
} from "lucide-react";
import ReportButton from "@/components/ReportButton";
import { useQueryClient } from "@tanstack/react-query";
import { useProfile, useFeed, useLike } from "@/hooks/useProfile";
import { useFollowToggle } from "@/hooks/useFollow";
import { useAuth } from "@/context/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import FeedCard from "@/components/FeedCard";
import { uploadImage } from "@/api/upload.api";
import { updateProfile } from "@/api/users.api";
import AvatarCropModal from "@/features/profile/AvatarCropModal";
import AvatarViewer from "@/features/profile/AvatarViewer";
import AskForm from "@/features/profile/AskForm";
import FollowModal, { type ModalTab } from "@/features/profile/FollowModal";

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: me, isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const { data: profile, isLoading: profileLoading } = useProfile(
    username ?? ""
  );
  const [feedLimit, setFeedLimit] = useState(20);
  const { data: feedData, isLoading: feedLoading } = useFeed(
    username ?? "",
    feedLimit
  );
  const like = useLike(username ?? "");
  const followToggle = useFollowToggle(username ?? "");
  const [followModal, setFollowModal] = useState<ModalTab | null>(null);
  const [showAvatarViewer, setShowAvatarViewer] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  // Scroll to a specific answer from a notification / shared link.
  // Profile and feed must both be ready (they load in parallel).
  // If the element is not yet in the DOM, keep loading more pages (up to 200)
  // until it is found — the answer might be older than the initial 20 items.
  useEffect(() => {
    if (feedLoading || profileLoading) return;
    const hash = location.hash;
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (
      feedData?.items.length === feedLimit &&
      feedLimit < 200
    ) {
      setFeedLimit((prev) => prev + 20);
    }
  }, [feedData, feedLoading, profileLoading, location.hash, feedLimit]);

  function handleAvatarFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCropSrc(url);
    setShowAvatarViewer(false);
    e.target.value = "";
  }

  async function handleCropSave(file: File) {
    setUploadingAvatar(true);
    setCropSrc(null);
    try {
      const url = await uploadImage(file, "avatar");
      await updateProfile({ avatar_url: url });
      qc.invalidateQueries({ queryKey: ["profile", username] });
    } finally {
      setUploadingAvatar(false);
    }
  }

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
  const isAdminOrMod = me?.role === "admin" || me?.role === "moderator";
  const canViewFeed =
    !profile.is_private || isOwner || isAdminOrMod || profile.is_following;
  let followLabel = "Follow";
  if (profile.is_following) followLabel = "Unfollow";
  else if (profile.is_pending) followLabel = "Requested";

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      {/* Cover image */}
      {profile.cover_image_url && (
        <div className="mb-0 -mx-4 h-32 overflow-hidden rounded-t-lg sm:mx-0">
          <img
            src={profile.cover_image_url}
            alt="Cover"
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Profile header */}
      <Card className={profile.cover_image_url ? "rounded-t-none" : ""}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* Clickable avatar */}
            <button
              type="button"
              className="relative shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={() => setShowAvatarViewer(true)}
              aria-label="View profile photo"
            >
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-border"
                />
              ) : (
                <UserCircle2 className="h-16 w-16 text-muted-foreground/40" />
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                </div>
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold">{profile.display_name}</h1>
                {profile.role !== "user" && (isOwner || isAdminOrMod) && (
                  <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary capitalize">
                    {profile.role}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                @{profile.username}
              </p>
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

              <div className="mt-3 flex gap-4 text-sm">
                <button
                  type="button"
                  onClick={() => setFollowModal("followers")}
                  className="hover:underline text-left"
                >
                  <strong className="text-foreground">
                    {profile.follower_count}
                  </strong>{" "}
                  <span className="text-muted-foreground">followers</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFollowModal("following")}
                  className="hover:underline text-left"
                >
                  <strong className="text-foreground">
                    {profile.following_count}
                  </strong>{" "}
                  <span className="text-muted-foreground">following</span>
                </button>
                <span>
                  <strong className="text-foreground">
                    {profile.answer_count}
                  </strong>{" "}
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
              isAuthenticated && (
                <>
                  <Button
                    variant={
                      profile.is_following || profile.is_pending
                        ? "outline"
                        : "secondary"
                    }
                    size="sm"
                    onClick={() =>
                      followToggle.mutate(
                        profile.is_following || profile.is_pending
                          ? "unfollow"
                          : "follow"
                      )
                    }
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
                  <ReportButton
                    contentType="user"
                    contentId={profile.id}
                    size="full"
                  />
                </>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hidden file input for avatar upload */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarFileSelected}
      />

      {/* Followers / Following modal */}
      {followModal && username && (
        <FollowModal
          username={username}
          tab={followModal}
          onClose={() => setFollowModal(null)}
          onTabChange={setFollowModal}
        />
      )}

      {/* Avatar viewer */}
      {showAvatarViewer && (
        <AvatarViewer
          avatarUrl={profile.avatar_url ?? null}
          displayName={profile.display_name}
          isOwner={isOwner}
          onEdit={() => avatarInputRef.current?.click()}
          onClose={() => setShowAvatarViewer(false)}
        />
      )}

      {/* Avatar crop modal */}
      {cropSrc && (
        <AvatarCropModal
          src={cropSrc}
          onSave={handleCropSave}
          onCancel={() => {
            URL.revokeObjectURL(cropSrc);
            setCropSrc(null);
          }}
        />
      )}

      {/* Ask form */}
      <div className="mt-4">
        <AskForm
          recipientUsername={username ?? ""}
          isSelf={isOwner}
          me={me}
          isAuthenticated={isAuthenticated}
        />
      </div>

      {/* Feed */}
      <div className="mt-6">
        {!canViewFeed && (
          <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
            <Lock className="h-10 w-10 opacity-30" />
            <p className="font-medium text-foreground">
              This account is private
            </p>
            <p className="text-sm text-center">
              Follow this account to see their answers.
            </p>
          </div>
        )}

        {canViewFeed &&
          (feedLoading ? (
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
          ))}
      </div>
    </div>
  );
}
