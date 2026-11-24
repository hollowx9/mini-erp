import { useEffect, useRef } from "react";
import { toast } from "react-toastify";

import {
  getNotifications,
  markNotificationAsRead,
} from "../../services/notificationService";

function NotificationWatcher() {
  const shownNotifications = useRef(new Set());

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const notifications = await getNotifications();

        for (const notification of notifications) {
          const isRead = notification.is_read === 1 || notification.is_read === true;

          if (!isRead && !shownNotifications.current.has(notification.id)) {
            shownNotifications.current.add(notification.id);

            toast.info(notification.message);

            await markNotificationAsRead(notification.id);
          }
        }
      } catch (error) {
        console.error("Notification watcher error:", error);
      }
    };

    fetchNotifications();

    const interval = setInterval(fetchNotifications, 5000);

    return () => clearInterval(interval);
  }, []);

  return null;
}

export default NotificationWatcher;