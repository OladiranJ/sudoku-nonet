"use client";

import { useEffect, useCallback } from "react";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { useAudioStore } from "@/lib/store/audioStore";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function ToggleSwitch({
  checked,
  onChange,
  label,
  testId,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  testId: string;
}) {
  return (
    <label
      className="flex items-center justify-between py-3 cursor-pointer"
      style={{ borderBottom: "1px solid var(--p-grid)" }}
      data-testid={testId}
    >
      <span
        className="text-sm font-medium"
        style={{ color: "var(--p-text)" }}
      >
        {label}
      </span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 cursor-pointer"
        style={{
          background: checked ? "var(--p-primary)" : "var(--p-grid)",
        }}
        data-testid={`${testId}-toggle`}
      >
        <span
          className="inline-block h-5 w-5 rounded-full shadow-sm transition-transform duration-200"
          style={{
            background: "var(--p-cell)",
            transform: checked ? "translateX(1.25rem)" : "translateX(0.125rem)",
            marginTop: "0.125rem",
          }}
        />
      </button>
    </label>
  );
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const highlightRowCol = useSettingsStore((s) => s.highlightRowCol);
  const highlightBox = useSettingsStore((s) => s.highlightBox);
  const highlightIdenticalNumbers = useSettingsStore((s) => s.highlightIdenticalNumbers);
  const setHighlightRowCol = useSettingsStore((s) => s.setHighlightRowCol);
  const setHighlightBox = useSettingsStore((s) => s.setHighlightBox);
  const setHighlightIdenticalNumbers = useSettingsStore((s) => s.setHighlightIdenticalNumbers);
  const audioEnabled = useAudioStore((s) => s.enabled);
  const toggleAudio = useAudioStore((s) => s.toggle);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      data-testid="settings-modal"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0, 0, 0, 0.5)" }}
        onClick={onClose}
      />

      {/* Modal content */}
      <div
        className="relative w-full max-w-md mx-4 rounded-t-2xl sm:rounded-2xl overflow-hidden"
        style={{
          background: "var(--p-bg)",
          boxShadow: "0 -4px 32px rgba(0,0,0,0.15)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <h2
            className="text-xl font-bold font-serif"
            style={{ color: "var(--p-text)", letterSpacing: "-0.02em" }}
          >
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors duration-150 cursor-pointer"
            style={{ color: "var(--p-text)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--p-primary-soft)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
            aria-label="Close settings"
            data-testid="settings-close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Settings body */}
        <div className="px-5 pb-6">
          {/* Gameboard Settings section */}
          <p
            className="text-xs font-semibold uppercase tracking-wider mt-3 mb-1"
            style={{ color: "var(--p-text-muted)" }}
          >
            Gameboard Settings
          </p>

          <ToggleSwitch
            checked={highlightRowCol}
            onChange={setHighlightRowCol}
            label="Highlight row and column"
            testId="setting-highlight-row-col"
          />

          <ToggleSwitch
            checked={highlightBox}
            onChange={setHighlightBox}
            label="Highlight box"
            testId="setting-highlight-box"
          />

          <ToggleSwitch
            checked={highlightIdenticalNumbers}
            onChange={setHighlightIdenticalNumbers}
            label="Highlight identical numbers"
            testId="setting-highlight-identical"
          />

          {/* Audio section */}
          <p
            className="text-xs font-semibold uppercase tracking-wider mt-5 mb-1"
            style={{ color: "var(--p-text-muted)" }}
          >
            Audio
          </p>

          <ToggleSwitch
            checked={audioEnabled}
            onChange={() => toggleAudio()}
            label="Play sound on solve"
            testId="setting-audio"
          />
        </div>
      </div>
    </div>
  );
}
