"use client";

import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc/client";

type Notification = {
  id: string;
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
  read: boolean;
  created_at: string;
};

function formatNotificationMessage(notif: Notification): string {
  switch (notif.type) {
    case "follow":
      return `${notif.payload?.follower_username ?? "Someone"} followed you`;
    case "challenge_received":
      return `${notif.payload?.challenger_username ?? "Someone"} challenged you to a ${notif.payload?.difficulty ?? ""} puzzle`;
    case "challenge_result": {
      const winner = notif.payload?.winner;
      if (winner === "tie") return "Challenge result: it's a tie!";
      if (winner === "challenger") return "Challenge result: you lost";
      return "Challenge result: you won!";
    }
    case "achievement":
      return `Achievement unlocked: ${notif.payload?.badge_name ?? "Unknown"}`;
    default:
      return "New notification";
  }
}

function notificationIcon(type: string): string {
  switch (type) {
    case "follow":
      return "\u{1F464}";
    case "challenge_received":
    case "challenge_result":
      return "\u{2694}\uFE0F";
    case "achievement":
      return "\u{1F3C6}";
    default:
      return "\u{1F514}";
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationsPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: notifications = [], isLoading } = trpc.notification.list.useQuery(undefined, {
    enabled: open,
  });

  const markAsRead = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      utils.notification.getUnreadCount.invalidate();
      utils.notification.list.invalidate();
    },
  });

  const utils = trpc.useUtils();

  // Mark all as read when panel opens
  useEffect(() => {
    if (open && notifications.length > 0) {
      const hasUnread = notifications.some((n: Notification) => !n.read);
      if (hasUnread) {
        markAsRead.mutate({ all: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, notifications.length]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Use setTimeout so the opening click doesn't immediately close
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handler);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handler);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      data-testid="notifications-panel"
      className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900 z-50"
    >
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Notifications
        </h2>
      </div>

      {isLoading ? (
        <div className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Loading...
        </div>
      ) : notifications.length === 0 ? (
        <div
          data-testid="notifications-empty"
          className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400"
        >
          No notifications yet
        </div>
      ) : (
        <ul data-testid="notifications-list" className="divide-y divide-slate-100 dark:divide-slate-800">
          {notifications.map((notif: Notification) => (
            <li
              key={notif.id}
              data-testid={`notification-item-${notif.type}`}
              className={`px-4 py-3 flex items-start gap-3 transition-colors duration-150 ${
                !notif.read
                  ? "bg-amber-50 dark:bg-amber-950/20"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <span className="text-lg flex-shrink-0" aria-hidden="true">
                {notificationIcon(notif.type)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-900 dark:text-slate-100">
                  {formatNotificationMessage(notif)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {timeAgo(notif.created_at)}
                </p>
              </div>
              {!notif.read && (
                <span
                  data-testid="unread-dot"
                  className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 mt-1.5"
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
