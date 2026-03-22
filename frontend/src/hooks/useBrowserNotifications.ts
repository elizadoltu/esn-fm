const STORAGE_KEY = 'esn_fm_browser_notif';

export function getBrowserNotifEnabled(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export function setBrowserNotifEnabled(value: boolean): void {
  localStorage.setItem(STORAGE_KEY, String(value));
}

export async function requestAndEnable(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') {
    setBrowserNotifEnabled(true);
    return true;
  }
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  if (result === 'granted') {
    setBrowserNotifEnabled(true);
    return true;
  }
  return false;
}

export function showBrowserNotification(title: string, body: string): void {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  if (!getBrowserNotifEnabled()) return;
  new Notification(title, { body, icon: '/favicon.ico' });
}
