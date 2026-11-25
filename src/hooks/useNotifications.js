import { useCallback, useEffect, useState } from 'react';
import {
  evaluateNotificationRules,
  getNotificationPermission,
  requestNotificationPermission,
  sendBrowserNotification,
} from '../services/notificationService.js';

export function useNotifications({ selectedBus, selectedStop, now }) {
  const [permission, setPermission] = useState(() => getNotificationPermission());
  const [toasts, setToasts] = useState([]);

  const requestPermission = useCallback(async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    return result;
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    if (!selectedBus || !selectedStop) return;
    const stopEntry = selectedBus.stopEtas?.[selectedStop.id];
    if (!stopEntry) return;

    const newAlerts = evaluateNotificationRules({
      bus: selectedBus,
      stop: selectedStop,
      etaResult: stopEntry.eta,
      delayResult: stopEntry.delay,
      freshness: selectedBus.freshness,
      now,
    });

    if (!newAlerts.length) return;

    newAlerts.forEach((alert) => {
      sendBrowserNotification(alert.title, alert.message, alert.key);
    });

    setToasts((prev) => [
      ...newAlerts.map((a) => ({
        ...a,
        id: `${a.key}_${Date.now()}`,
        createdAt: Date.now(),
      })),
      ...prev,
    ].slice(0, 6));
  }, [selectedBus, selectedStop, now]);

  return {
    permission,
    requestPermission,
    toasts,
    dismissToast,
  };
}
