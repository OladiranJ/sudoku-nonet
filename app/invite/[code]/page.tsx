"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";

type Step = "validating" | "invalid" | "auth-select" | "email-form" | "username" | "oauth-username";
type OAuthProvider = "google" | "apple";

export default function InvitePage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = params.code;

  const [step, setStep] = useState<Step>("validating");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [oauthProvider, setOauthProvider] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Validate invite code on mount
  const validateQuery = trpc.auth.validateInvite.useQuery(
    { code },
    {
      retry: false,
      refetchOnWindowFocus: false,
      enabled: !!code,
    }
  );

  // Derive step from query result (only on initial load)
  if (step === "validating" && !validateQuery.isLoading) {
    if (validateQuery.data?.valid) {
      setStep("auth-select");
    } else {
      setStep("invalid");
    }
  }

  const signUpMutation = trpc.auth.signUp.useMutation({
    onSuccess: () => {
      router.push("/");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const oauthUrlMutation = trpc.auth.getOAuthUrl.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const validateEmailForm = useCallback(() => {
    const errors: Record<string, string> = {};
    if (!email) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.email = "Invalid email address";
    if (!password) errors.password = "Password is required";
    else if (password.length < 8)
      errors.password = "Password must be at least 8 characters";
    if (password !== confirmPassword)
      errors.confirmPassword = "Passwords do not match";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [email, password, confirmPassword]);

  const validateUsername = useCallback(() => {
    const errors: Record<string, string> = {};
    if (!username) errors.username = "Username is required";
    else if (username.length < 3)
      errors.username = "Username must be at least 3 characters";
    else if (username.length > 20)
      errors.username = "Username must be at most 20 characters";
    else if (!/^[a-zA-Z0-9_]+$/.test(username))
      errors.username = "Only letters, numbers, and underscores";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [username]);

  const handleEmailSubmit = useCallback(() => {
    if (validateEmailForm()) {
      setError("");
      setFieldErrors({});
      setStep("username");
    }
  }, [validateEmailForm]);

  const handleUsernameSubmit = useCallback(() => {
    if (!validateUsername()) return;
    setError("");
    signUpMutation.mutate({
      email,
      password,
      inviteCode: code,
      username,
    });
  }, [validateUsername, email, password, code, username, signUpMutation]);

  const handleOAuthSelect = useCallback((provider: OAuthProvider) => {
    setOauthProvider(provider);
    setError("");
    setFieldErrors({});
    setStep("oauth-username");
  }, []);

  const handleOAuthUsernameSubmit = useCallback(() => {
    if (!validateUsername()) return;
    if (!oauthProvider) return;
    setError("");
    oauthUrlMutation.mutate({
      inviteCode: code,
      provider: oauthProvider,
      username,
      redirectUrl: window.location.href,
    });
  }, [validateUsername, oauthProvider, code, username, oauthUrlMutation]);

  return (
    <div className="min-h-screen flex items-start justify-center pt-16 sm:pt-24 px-4">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-lg shadow-elevated dark:shadow-elevated-dark p-8"
        data-testid="invite-card"
      >
        {/* Wordmark */}
        <h1
          className="text-3xl font-serif font-bold text-center text-brand-800 dark:text-brand-300 mb-2 tracking-tight"
          style={{ letterSpacing: "-0.03em" }}
        >
          Nonet
        </h1>
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-8">
          You&apos;ve been invited to join
        </p>

        {/* Step: Validating */}
        {step === "validating" && (
          <div className="flex justify-center py-8" data-testid="loading-spinner">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          </div>
        )}

        {/* Step: Invalid */}
        {step === "invalid" && (
          <div data-testid="invalid-code">
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Invalid Invite
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                This invite link is invalid or has expired.
              </p>
              <a
                href="/"
                className="inline-block px-6 py-2.5 rounded-md bg-brand-600 text-white font-medium hover:bg-brand-700 active:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 transition-colors"
                data-testid="go-home"
              >
                Go to Nonet
              </a>
            </div>
          </div>
        )}

        {/* Step: Auth Method Selection */}
        {step === "auth-select" && (
          <div data-testid="auth-select">
            <div className="space-y-3">
              <button
                onClick={() => setStep("email-form")}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-750 active:bg-slate-100 dark:active:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 transition-colors"
                data-testid="auth-email"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                Sign up with Email
              </button>
              <button
                onClick={() => handleOAuthSelect("google")}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-750 active:bg-slate-100 dark:active:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 transition-colors"
                data-testid="auth-google"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign up with Google
              </button>
              <button
                onClick={() => handleOAuthSelect("apple")}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-750 active:bg-slate-100 dark:active:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 transition-colors"
                data-testid="auth-apple"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Sign up with Apple
              </button>
            </div>
          </div>
        )}

        {/* Step: Email Form */}
        {step === "email-form" && (
          <div data-testid="email-form">
            <button
              onClick={() => { setStep("auth-select"); setFieldErrors({}); setError(""); }}
              className="mb-4 text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 transition-colors"
              data-testid="back-button"
            >
              &larr; Back
            </button>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-2 focus:outline-brand-600 focus:border-brand-600 transition-colors"
                  placeholder="you@example.com"
                  data-testid="input-email"
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-sm text-red-500" data-testid="error-email">{fieldErrors.email}</p>
                )}
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-2 focus:outline-brand-600 focus:border-brand-600 transition-colors"
                  placeholder="At least 8 characters"
                  data-testid="input-password"
                />
                {fieldErrors.password && (
                  <p className="mt-1 text-sm text-red-500" data-testid="error-password">{fieldErrors.password}</p>
                )}
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-2 focus:outline-brand-600 focus:border-brand-600 transition-colors"
                  placeholder="Repeat your password"
                  data-testid="input-confirm-password"
                />
                {fieldErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500" data-testid="error-confirm-password">{fieldErrors.confirmPassword}</p>
                )}
              </div>
              <button
                onClick={handleEmailSubmit}
                className="w-full py-3 px-4 rounded-md bg-brand-600 text-white font-medium hover:bg-brand-700 active:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 transition-colors"
                data-testid="email-next"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step: Username (after email form) */}
        {step === "username" && (
          <div data-testid="username-step">
            <button
              onClick={() => { setStep("email-form"); setFieldErrors({}); setError(""); }}
              className="mb-4 text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 transition-colors"
              data-testid="back-button"
            >
              &larr; Back
            </button>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
              Choose a username
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              This is how other players will see you.
            </p>
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-2 focus:outline-brand-600 focus:border-brand-600 transition-colors"
                  placeholder="your_username"
                  data-testid="input-username"
                />
                {fieldErrors.username && (
                  <p className="mt-1 text-sm text-red-500" data-testid="error-username">{fieldErrors.username}</p>
                )}
              </div>
              {error && (
                <p className="text-sm text-red-500" data-testid="signup-error">{error}</p>
              )}
              <button
                onClick={handleUsernameSubmit}
                disabled={signUpMutation.isPending}
                className="w-full py-3 px-4 rounded-md bg-brand-600 text-white font-medium hover:bg-brand-700 active:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                data-testid="submit-signup"
              >
                {signUpMutation.isPending ? "Creating account..." : "Create Account"}
              </button>
            </div>
          </div>
        )}

        {/* Step: Username for OAuth (collected before redirect) */}
        {step === "oauth-username" && (
          <div data-testid="oauth-username-step">
            <button
              onClick={() => { setStep("auth-select"); setOauthProvider(null); setFieldErrors({}); setError(""); }}
              className="mb-4 text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 transition-colors"
              data-testid="back-button"
            >
              &larr; Back
            </button>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
              Choose a username
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Pick a username, then sign in with {oauthProvider === "google" ? "Google" : "Apple"}.
            </p>
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-2 focus:outline-brand-600 focus:border-brand-600 transition-colors"
                  placeholder="your_username"
                  data-testid="input-username"
                />
                {fieldErrors.username && (
                  <p className="mt-1 text-sm text-red-500" data-testid="error-username">{fieldErrors.username}</p>
                )}
              </div>
              {error && (
                <p className="text-sm text-red-500" data-testid="signup-error">{error}</p>
              )}
              <button
                onClick={handleOAuthUsernameSubmit}
                disabled={oauthUrlMutation.isPending}
                className="w-full py-3 px-4 rounded-md bg-brand-600 text-white font-medium hover:bg-brand-700 active:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                data-testid="submit-oauth"
              >
                {oauthUrlMutation.isPending ? "Redirecting..." : `Continue with ${oauthProvider === "google" ? "Google" : "Apple"}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
