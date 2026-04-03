"use client";

import { useState } from "react";
import Link from "next/link";
import { useThemeStore } from "@/lib/store/themeStore";
import { useAudioStore } from "@/lib/store/audioStore";
import { trpc } from "@/lib/trpc/client";
import NotificationsPanel from "@/components/social/NotificationsPanel";
import PalettePicker from "@/components/theme/PalettePicker";

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function NavButton({ children, onClick, ariaLabel, testId, ...rest }: {
  children: React.ReactNode;
  onClick?: () => void;
  ariaLabel: string;
  testId: string;
  className?: string;
}) {
  return (
    <button
      data-testid={testId}
      aria-label={ariaLabel}
      onClick={onClick}
      className="p-2 rounded-lg transition-colors duration-150 cursor-pointer"
      style={{ color: "var(--p-text)" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--p-primary-soft)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      {...rest}
    >
      {children}
    </button>
  );
}

function NavLink({ children, href, ariaLabel, testId }: {
  children: React.ReactNode;
  href: string;
  ariaLabel: string;
  testId: string;
}) {
  return (
    <Link
      href={href}
      data-testid={testId}
      aria-label={ariaLabel}
      className="p-2 rounded-lg transition-colors duration-150"
      style={{ color: "var(--p-text)" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--p-primary-soft)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      {children}
    </Link>
  );
}

interface HeaderProps {
  onOpenSettings?: () => void;
}

export default function Header({ onOpenSettings }: HeaderProps) {
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);
  const audioEnabled = useAudioStore((s) => s.enabled);
  const toggleAudio = useAudioStore((s) => s.toggle);
  const [notifOpen, setNotifOpen] = useState(false);
  const { data: unreadData } = trpc.notification.getUnreadCount.useQuery(undefined, {
    refetchInterval: 30_000,
  });
  const unreadCount = unreadData?.count ?? 0;

  return (
    <header
      data-testid="header"
      className="flex items-center justify-between w-full px-4 py-3 md:px-6"
      style={{ borderBottom: "1px solid var(--p-grid)" }}
    >
      <h1
        className="text-2xl font-bold tracking-tight font-serif"
        data-testid="wordmark"
        style={{ color: "var(--p-text)", letterSpacing: "-0.03em" }}
      >
        Nonet
      </h1>
      <nav className="flex items-center gap-1" aria-label="Main navigation">
        <NavLink href="/feed" ariaLabel="Friend Feed" testId="nav-feed">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </NavLink>
        <NavLink href="/leaderboard" ariaLabel="Leaderboard" testId="nav-leaderboard">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        </NavLink>
        <div className="relative">
          <NavButton
            testId="nav-notifications"
            ariaLabel="Notifications"
            onClick={() => setNotifOpen((prev) => !prev)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span
                data-testid="unread-badge"
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-white text-[10px] font-bold leading-none px-1"
                style={{ background: "var(--p-error)" }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </NavButton>
          <NotificationsPanel
            open={notifOpen}
            onClose={() => setNotifOpen(false)}
          />
        </div>
        <NavButton testId="nav-settings" ariaLabel="Settings" onClick={onOpenSettings}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </NavButton>
        <NavButton testId="nav-audio" ariaLabel="Toggle sound" onClick={toggleAudio}>
          {audioEnabled ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          )}
        </NavButton>
        <PalettePicker />
        <NavButton testId="nav-theme" ariaLabel="Toggle theme" onClick={toggle}>
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </NavButton>
        <NavButton testId="nav-profile" ariaLabel="Profile">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </NavButton>
      </nav>
    </header>
  );
}
