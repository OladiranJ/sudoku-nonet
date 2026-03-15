"use client";

export default function Header() {
  return (
    <header
      data-testid="header"
      className="flex items-center justify-between w-full px-4 py-3 md:px-6"
    >
      <h1 className="text-2xl font-bold tracking-tight" data-testid="wordmark">
        Nonet
      </h1>
      <nav className="flex items-center gap-1" aria-label="Main navigation">
        <button
          data-testid="nav-stats"
          aria-label="Stats"
          className="p-2 rounded-lg hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-400 active:bg-slate-200 transition-colors duration-150"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        </button>
        <button
          data-testid="nav-notifications"
          aria-label="Notifications"
          className="p-2 rounded-lg hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-400 active:bg-slate-200 transition-colors duration-150"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
        <button
          data-testid="nav-theme"
          aria-label="Toggle theme"
          className="p-2 rounded-lg hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-400 active:bg-slate-200 transition-colors duration-150"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </button>
        <button
          data-testid="nav-profile"
          aria-label="Profile"
          className="p-2 rounded-lg hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-400 active:bg-slate-200 transition-colors duration-150"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>
      </nav>
    </header>
  );
}
