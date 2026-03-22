import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/useAuth";
import { updateProfile, getMe, deleteAccount } from "@/api/users.api";
import { extractApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Bell } from "lucide-react";
import {
  getBrowserNotifEnabled,
  requestAndEnable,
  setBrowserNotifEnabled,
} from "@/hooks/useBrowserNotifications";
import ImageUpload from "@/components/ImageUpload";

export default function SettingsPage() {
  const { login: saveLogin, token, logout } = useAuth();
  const navigate = useNavigate();
  const [notifEnabled, setNotifEnabled] = useState(getBrowserNotifEnabled);
  const [notifPermission, setNotifPermission] = useState<
    NotificationPermission | "unsupported"
  >("Notification" in globalThis ? Notification.permission : "unsupported");
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
    getMe().then((profile) => {
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
    setBrowserNotifEnabled(false);
    setNotifEnabled(false);
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
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(extractApiError(err, "Failed to save settings. Please try again."));
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
                onUploaded={(url) =>
                  setForm((p) => ({ ...p, avatar_url: url }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>Cover image</Label>
              <ImageUpload
                type="cover"
                currentUrl={form.cover_image_url}
                onUploaded={(url) =>
                  setForm((p) => ({ ...p, cover_image_url: url }))
                }
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
                  {notifPermission === "denied"
                    ? "Notifications are blocked in your browser settings. Please allow them manually."
                    : notifPermission === "unsupported"
                      ? "Your browser does not support notifications."
                      : "Get notified instantly when you receive questions, answers, or messages."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

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
          {saved ? (
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Saved
            </span>
          ) : loading ? (
            "Saving…"
          ) : (
            "Save changes"
          )}
        </Button>
      </form>
    </div>
  );
}
