import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/useAuth";
import { updateProfile, getMe, deleteAccount } from "@/api/users.api";
import { getArchivedAnswers, archiveAnswer } from "@/api/answers.api";
import { extractApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2,
  Bell,
  Download,
  Smartphone,
  Archive,
  RotateCcw,
} from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
import {
  getBrowserNotifEnabled,
  requestAndEnable,
  disableNotifications,
} from "@/hooks/useBrowserNotifications";
import ImageUpload from "@/components/ImageUpload";
import { toast } from "sonner";

function notifStatusText(
  permission: NotificationPermission | "unsupported",
  enabled: boolean
): string {
  if (permission === "denied")
    return "Notifications are blocked. To enable, go to browser settings → Site settings → Notifications and allow this site.";
  if (permission === "unsupported")
    return "Your browser does not support notifications.";
  if (!enabled && permission === "granted")
    return "Notifications are paused. To fully disable them, go to browser settings → Site settings → Notifications.";
  return "Get notified instantly when you receive questions, answers, or messages.";
}

function ArchiveSection() {
  const qc = useQueryClient();
  const { data: archived = [], isLoading } = useQuery({
    queryKey: ["archivedAnswers"],
    queryFn: getArchivedAnswers,
  });
  const unarchive = useMutation({
    mutationFn: archiveAnswer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["archivedAnswers"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["homeFeed"] });
      qc.invalidateQueries({ queryKey: ["mainFeed"] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Archive className="h-4 w-4" />
          Archived Q&amp;As
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && archived.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No archived Q&amp;As yet.
          </p>
        )}
        <div className="space-y-3">
          {archived.map((item) => (
            <div
              key={item.answer_id}
              className="rounded-lg border border-border p-3 space-y-1"
            >
              <p className="text-xs text-muted-foreground truncate">
                {item.question}
              </p>
              <p className="text-sm truncate">{item.answer}</p>
              <button
                type="button"
                disabled={unarchive.isPending}
                onClick={() => unarchive.mutate(item.answer_id)}
                className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
              >
                <RotateCcw className="h-3 w-3" />
                Restore
              </button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const { login: saveLogin, token, logout, user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [notifEnabled, setNotifEnabled] = useState(getBrowserNotifEnabled);
  const [notifPermission, setNotifPermission] = useState<
    NotificationPermission | "unsupported"
  >("Notification" in globalThis ? Notification.permission : "unsupported");
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(
    () => globalThis.matchMedia?.("(display-mode: standalone)").matches ?? false
  );

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    const installedHandler = () => setIsInstalled(true);
    globalThis.addEventListener("beforeinstallprompt", handler);
    globalThis.addEventListener("appinstalled", installedHandler);
    return () => {
      globalThis.removeEventListener("beforeinstallprompt", handler);
      globalThis.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  async function handleInstall() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setInstallPrompt(null);
      setIsInstalled(true);
    }
  }
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    display_name: "",
    bio: "",
    avatar_url: "",
    cover_image_url: "",
    location: "",
    website: "",
    allow_anonymous_questions: true,
    is_private: false,
  });

  useEffect(() => {
    getMe()
      .then((profile) => {
        setForm({
          display_name: profile.display_name ?? "",
          bio: profile.bio ?? "",
          avatar_url: profile.avatar_url ?? "",
          cover_image_url: profile.cover_image_url ?? "",
          location: profile.location ?? "",
          website: profile.website ?? "",
          allow_anonymous_questions: profile.allow_anonymous_questions,
          is_private: profile.is_private,
        });
      })
      .catch(() => {
        setError("Failed to load profile. Please refresh the page.");
      });
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleBool(name: string, value: boolean) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const deleteLabel = deleteConfirm
    ? "Confirm — cannot be undone"
    : "Deactivate account";

  async function handleDeleteAccount() {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    setDeleting(true);
    try {
      await deleteAccount();
      logout();
      navigate("/login");
    } catch {
      setError("Failed to deactivate account.");
      setDeleting(false);
      setDeleteConfirm(false);
    }
  }

  async function handleEnableNotif() {
    const granted = await requestAndEnable();
    setNotifEnabled(granted);
    setNotifPermission(
      "Notification" in globalThis ? Notification.permission : "unsupported"
    );
  }

  function handleDisableNotif() {
    disableNotifications().catch(() => {});
    setNotifEnabled(false);
    setNotifPermission(
      "Notification" in globalThis ? Notification.permission : "unsupported"
    );
  }

  async function savePhoto(
    field: "avatar_url" | "cover_image_url",
    url: string
  ) {
    setForm((p) => ({ ...p, [field]: url }));
    if (!url) return;
    try {
      const updated = await updateProfile({ [field]: url });
      if (token) {
        saveLogin(token, {
          ...updated,
          email: updated.email ?? "",
        } as Parameters<typeof saveLogin>[1]);
      }
      if (user?.username) {
        qc.invalidateQueries({ queryKey: ["profile", user.username] });
      }
    } catch {
      toast.error("Failed to save photo. Tap Save changes to keep it.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const updated = await updateProfile({
        display_name: form.display_name || undefined,
        bio: form.bio || undefined,
        avatar_url: form.avatar_url || undefined,
        cover_image_url: form.cover_image_url || undefined,
        location: form.location || null,
        website: form.website || null,
        allow_anonymous_questions: form.allow_anonymous_questions,
        is_private: form.is_private,
      });
      if (token) {
        saveLogin(token, {
          ...updated,
          email: updated.email ?? "",
        } as Parameters<typeof saveLogin>[1]);
      }
      if (user?.username) {
        qc.invalidateQueries({ queryKey: ["profile", user.username] });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(
        extractApiError(err, "Failed to save settings. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Photos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-1.5">
              <Label>Profile photo</Label>
              <ImageUpload
                type="avatar"
                currentUrl={form.avatar_url}
                onUploaded={(url) => savePhoto("avatar_url", url)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Cover image</Label>
              <ImageUpload
                type="cover"
                currentUrl={form.cover_image_url}
                onUploaded={(url) => savePhoto("cover_image_url", url)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="display_name">Display name</Label>
              <Input
                id="display_name"
                name="display_name"
                value={form.display_name}
                onChange={handleChange}
                maxLength={60}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={form.bio}
                onChange={handleChange}
                maxLength={200}
                rows={3}
              />
              <p className="text-right text-xs text-muted-foreground">
                {form.bio.length}/200
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="City, Country"
                maxLength={100}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                name="website"
                type="url"
                value={form.website}
                onChange={handleChange}
                placeholder="https://example.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <input
                id="allow_anonymous_questions"
                type="checkbox"
                checked={form.allow_anonymous_questions}
                onChange={(e) =>
                  handleBool("allow_anonymous_questions", e.target.checked)
                }
                className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
              />
              <div>
                <Label
                  htmlFor="allow_anonymous_questions"
                  className="cursor-pointer"
                >
                  Allow anonymous questions
                </Label>
                <p className="text-xs text-muted-foreground">
                  Anyone can ask you questions without revealing their identity
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                id="is_private"
                type="checkbox"
                checked={form.is_private}
                onChange={(e) => handleBool("is_private", e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
              />
              <div>
                <Label htmlFor="is_private" className="cursor-pointer">
                  Private profile
                </Label>
                <p className="text-xs text-muted-foreground">
                  Only approved followers can see your answers
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <input
                id="browser_notif"
                type="checkbox"
                checked={notifEnabled}
                disabled={
                  notifPermission === "denied" ||
                  notifPermission === "unsupported"
                }
                onChange={(e) =>
                  e.target.checked ? handleEnableNotif() : handleDisableNotif()
                }
                className="mt-0.5 h-4 w-4 rounded border-input accent-primary disabled:opacity-50"
              />
              <div>
                <Label
                  htmlFor="browser_notif"
                  className="cursor-pointer flex items-center gap-1.5"
                >
                  <Bell className="h-4 w-4" />
                  Browser notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  {notifStatusText(notifPermission, notifEnabled)}
                </p>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex items-center gap-1.5 mb-1">
                <Smartphone className="h-4 w-4" />
                <span className="text-sm font-medium">Install app</span>
              </div>

              {isInstalled && (
                <p className="text-xs text-muted-foreground">
                  ESN FM is installed on this device.
                </p>
              )}
              {!isInstalled && installPrompt && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Add ESN FM to your home screen for a native app experience.
                    {!notifEnabled && (
                      <span className="block mt-1 text-amber-500">
                        Enable notifications above to receive push alerts after
                        installing.
                      </span>
                    )}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleInstall}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Install ESN FM
                  </Button>
                </div>
              )}
              {!isInstalled && !installPrompt && (
                <p className="text-xs text-muted-foreground">
                  Open this page in your mobile browser and use{" "}
                  <span className="font-medium">Add to Home Screen</span> to
                  install the app. Enable notifications above to receive push
                  alerts after installing.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <ArchiveSection />

        {/* Danger Zone */}
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Deactivating your account anonymises your profile. Your questions
              and answers remain but your name shows as "Deleted User".
            </p>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDeleteAccount}
              disabled={deleting}
            >
              {deleting ? "Deactivating…" : deleteLabel}
            </Button>
            {deleteConfirm && !deleting && (
              <button
                type="button"
                className="ml-3 text-sm text-muted-foreground hover:underline"
                onClick={() => setDeleteConfirm(false)}
              >
                Cancel
              </button>
            )}
          </CardContent>
        </Card>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {saved && (
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Saved
            </span>
          )}
          {!saved && (loading ? "Saving…" : "Save changes")}
        </Button>
      </form>
    </div>
  );
}
