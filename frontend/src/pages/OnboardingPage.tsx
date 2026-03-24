import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserCircle2, Lock } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/useAuth";
import { followUser } from "@/api/follows.api";
import { Button } from "@/components/ui/button";
import client from "@/api/client";

interface OnboardingUser {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  is_private: boolean;
  follower_count: number;
}

const ONBOARDING_KEY = "esn_fm_onboarding_done";

export function hasCompletedOnboarding(userId: string): boolean {
  return localStorage.getItem(`${ONBOARDING_KEY}_${userId}`) === "true";
}

export function markOnboardingDone(userId: string): void {
  localStorage.setItem(`${ONBOARDING_KEY}_${userId}`, "true");
}

async function getAllUsers(): Promise<OnboardingUser[]> {
  const res = await client.get<OnboardingUser[]>("/api/users");
  return res.data;
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Set<string>>(new Set());

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["onboardingUsers"],
    queryFn: getAllUsers,
  });

  async function handleFollow(username: string, userId: string) {
    setPending((p) => new Set([...p, userId]));
    try {
      await followUser(username);
      setFollowed((f) => new Set([...f, userId]));
      qc.invalidateQueries({ queryKey: ["homeFeed"] });
    } finally {
      setPending((p) => {
        const next = new Set(p);
        next.delete(userId);
        return next;
      });
    }
  }

  function handleContinue() {
    if (user) markOnboardingDone(user.id);
    navigate("/home");
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold mb-2">Find people to follow</h1>
        <p className="text-sm text-muted-foreground">
          Follow people you know to fill your Friends feed.
        </p>
      </div>

      {isLoading && (
        <p className="py-12 text-center text-muted-foreground">Loading…</p>
      )}

      <div className="space-y-3">
        {users.map((u) => (
          <div
            key={u.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
          >
            {u.avatar_url ? (
              <img
                src={u.avatar_url}
                alt={u.display_name}
                className="h-11 w-11 shrink-0 rounded-full object-cover"
              />
            ) : (
              <UserCircle2 className="h-11 w-11 shrink-0 text-muted-foreground/40" />
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <p className="font-medium truncate">{u.display_name}</p>
                {u.is_private && (
                  <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">@{u.username}</p>
              {u.bio && (
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                  {u.bio}
                </p>
              )}
            </div>

            <Button
              size="sm"
              variant={followed.has(u.id) ? "outline" : "default"}
              disabled={pending.has(u.id)}
              onClick={() => !followed.has(u.id) && handleFollow(u.username, u.id)}
            >
              {followed.has(u.id) ? "Following" : "Follow"}
            </Button>
          </div>
        ))}
      </div>

      {!isLoading && (
        <div className="mt-8 flex justify-center">
          <Button size="lg" onClick={handleContinue} className="w-full max-w-xs">
            {followed.size > 0
              ? `Continue with ${followed.size} follow${followed.size > 1 ? "s" : ""}`
              : "Skip for now"}
          </Button>
        </div>
      )}
    </div>
  );
}
