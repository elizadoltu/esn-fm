import { useEffect } from "react";
import { useAuth } from "@/context/useAuth";
import client from "@/api/client";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/** Subscribe this device to Web Push and register it with the backend. */
export async function subscribeToPush(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return false;
  }
  if (!VAPID_PUBLIC_KEY) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (existing) return true; // already subscribed

    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    await client.post("/api/push/subscribe", sub.toJSON());
    return true;
  } catch {
    return false;
  }
}

/** Unsubscribe this device from Web Push. */
export async function unsubscribeFromPush(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.getSubscription();
    if (sub) {
      await client.delete("/api/push/subscribe", {
        data: { endpoint: sub.endpoint },
      });
      await sub.unsubscribe();
    }
  } catch {
    // ignore
  }
}

/**
 * On mount, if the user is authenticated and notifications are already granted,
 * re-register this device's push subscription (handles new installs / SW updates).
 */
export function usePushSubscription(): void {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    subscribeToPush().catch(() => {});
  }, [isAuthenticated]);
}
