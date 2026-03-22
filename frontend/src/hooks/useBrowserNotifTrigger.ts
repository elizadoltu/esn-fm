import { useEffect, useRef } from 'react';
import { showBrowserNotification } from './useBrowserNotifications';
import type { Notification } from '@/api/notifications.api';

export function useBrowserNotifTrigger(notifications: Notification[]) {
  const seenIds = useRef<Set<string>>(new Set(notifications.map((n) => n.id)));
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      // On first load, seed the seen set without showing anything
      seenIds.current = new Set(notifications.map((n) => n.id));
      isFirst.current = false;
      return;
    }
    for (const n of notifications) {
      if (!seenIds.current.has(n.id)) {
        seenIds.current.add(n.id);
        const actorName = n.actor?.display_name ?? n.actor?.username ?? 'Someone';
        const messages: Record<string, string> = {
          new_like: `${actorName} liked your answer`,
          new_comment: `${actorName} commented on your answer`,
          new_reply: `${actorName} replied to your comment`,
          new_follower: `${actorName} started following you`,
          new_question: `${actorName} asked you a question`,
          new_answer: `${actorName} answered your question`,
          new_dm: `${actorName} sent you a message`,
          follow_request: `${actorName} wants to follow you`,
        };
        showBrowserNotification('ESN FM', messages[n.type] ?? 'New notification');
      }
    }
  }, [notifications]);
}
