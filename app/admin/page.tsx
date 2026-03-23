"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";

type InviteStatus = "pending" | "used" | "expired";

interface Invite {
  id: string;
  code: string;
  status: InviteStatus;
  created_at: string;
  expires_at: string;
  used_by: string | null;
  used_at: string | null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: InviteStatus }) {
  const styles: Record<InviteStatus, string> = {
    pending: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    used: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    expired: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}

function AdminPanel() {
  const utils = trpc.useUtils();
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: invites, isLoading: listLoading } = trpc.invite.list.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const generateMutation = trpc.invite.generate.useMutation({
    onSuccess: (result) => {
      setGeneratedCode(result.code);
      setCopied(false);
      utils.invite.list.invalidate();
    },
  });

  const revokeMutation = trpc.invite.revoke.useMutation({
    onSuccess: () => {
      utils.invite.list.invalidate();
    },
  });

  const inviteLink = generatedCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${generatedCode}`
    : "";

  function handleCopy() {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6" data-testid="admin-panel">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Admin Panel
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Invite management
          </p>
        </div>

        {/* Generate Invite */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Generate Invite Link
          </h2>
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="px-4 py-2 rounded-md bg-brand-600 text-white font-medium text-sm hover:bg-brand-700 active:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            data-testid="generate-invite"
          >
            {generateMutation.isPending ? "Generating…" : "Generate Invite"}
          </button>

          {generatedCode && (
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-md space-y-2">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                New invite code
              </p>
              <p
                className="font-mono text-sm text-slate-900 dark:text-slate-100 break-all"
                data-testid="generated-code"
              >
                {generatedCode}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate flex-1">
                  {inviteLink}
                </span>
                <button
                  onClick={handleCopy}
                  className="shrink-0 px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 active:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 transition-colors"
                  data-testid="copy-link"
                >
                  {copied ? "Copied!" : "Copy link"}
                </button>
              </div>
            </div>
          )}

          {generateMutation.error && (
            <p className="mt-3 text-sm text-red-500" data-testid="generate-error">
              {generateMutation.error.message}
            </p>
          )}
        </div>

        {/* Invite List */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              All Invites
            </h2>
          </div>

          {listLoading ? (
            <div className="flex justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
            </div>
          ) : !invites || invites.length === 0 ? (
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-10">
              No invites yet.
            </p>
          ) : (
            <ul data-testid="invite-list" className="divide-y divide-slate-100 dark:divide-slate-800">
              {(invites as Invite[]).map((invite) => (
                <li
                  key={invite.id}
                  className="flex items-center justify-between px-6 py-3 gap-4"
                  data-testid={`invite-item-${invite.id}`}
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-mono text-sm text-slate-900 dark:text-slate-100">
                      {invite.code}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Created {formatDate(invite.created_at)}
                      {invite.used_at ? ` · Used ${formatDate(invite.used_at)}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span data-testid={`invite-status-${invite.id}`}>
                      <StatusBadge status={invite.status} />
                    </span>
                    {invite.status === "pending" && (
                      <button
                        onClick={() => revokeMutation.mutate({ id: invite.id })}
                        disabled={revokeMutation.isPending}
                        className="text-xs text-red-500 hover:text-red-600 dark:hover:text-red-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:opacity-50 transition-colors"
                        data-testid={`revoke-${invite.id}`}
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { data: me, isLoading } = trpc.profile.getMe.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  if (!me || !me.is_admin) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        data-testid="access-denied"
      >
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Access Denied
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            You do not have permission to view this page.
          </p>
          <a
            href="/"
            className="inline-block px-5 py-2 rounded-md bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 active:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 transition-colors"
          >
            Go home
          </a>
        </div>
      </div>
    );
  }

  return <AdminPanel />;
}
