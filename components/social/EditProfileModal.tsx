"use client";

import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc/client";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDisplayName: string | null;
  currentAvatarUrl: string | null;
  username: string;
}

const PRESET_AVATARS = [
  { id: "preset-ruby", color: "bg-red-500", label: "Ruby" },
  { id: "preset-emerald", color: "bg-emerald-500", label: "Emerald" },
  { id: "preset-sapphire", color: "bg-blue-500", label: "Sapphire" },
  { id: "preset-amber", color: "bg-amber-500", label: "Amber" },
  { id: "preset-violet", color: "bg-violet-500", label: "Violet" },
];

// Preset avatars use a data URL scheme so they can be stored in avatar_url
function presetToUrl(presetId: string): string {
  return `preset:${presetId}`;
}

function isPresetUrl(url: string | null): string | null {
  if (!url?.startsWith("preset:")) return null;
  return url.slice(7);
}

export function getPresetById(presetId: string) {
  return PRESET_AVATARS.find((p) => p.id === presetId) ?? null;
}

export { PRESET_AVATARS, isPresetUrl, presetToUrl };

export default function EditProfileModal({
  isOpen,
  onClose,
  currentDisplayName,
  currentAvatarUrl,
  username,
}: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState(currentDisplayName ?? "");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(currentAvatarUrl);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [error, setError] = useState("");

  const updateMutation = trpc.profile.updateProfile.useMutation({
    onSuccess: () => {
      onClose();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be under 2MB");
      return;
    }
    setError("");
    setUploadFile(file);
    setSelectedAvatar(null);
    const reader = new FileReader();
    reader.onload = () => setUploadPreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handlePresetSelect = useCallback((presetId: string) => {
    setSelectedAvatar(presetToUrl(presetId));
    setUploadFile(null);
    setUploadPreview(null);
    setError("");
  }, []);

  const handleSave = useCallback(async () => {
    setError("");

    let avatarUrl: string | null | undefined = undefined;

    if (uploadFile) {
      // Upload to Supabase Storage — client-side upload
      // For now, we'll use the trpc updateProfile with the preview data URL
      // In production, this would use supabase.storage.from('avatars').upload()
      // For the MVP, we store the preview as a data URL (or the preset URL)
      avatarUrl = uploadPreview;
    } else if (selectedAvatar !== currentAvatarUrl) {
      avatarUrl = selectedAvatar;
    }

    const updates: { display_name?: string; avatar_url?: string | null } = {};
    if (displayName !== (currentDisplayName ?? "")) {
      updates.display_name = displayName || undefined;
    }
    if (avatarUrl !== undefined) {
      updates.avatar_url = avatarUrl;
    }

    if (Object.keys(updates).length === 0) {
      onClose();
      return;
    }

    updateMutation.mutate(updates);
  }, [displayName, currentDisplayName, selectedAvatar, currentAvatarUrl, uploadFile, uploadPreview, updateMutation, onClose]);

  if (!isOpen) return null;

  const activePreset = isPresetUrl(selectedAvatar);
  const showingUpload = !!uploadPreview;
  const showingPreset = !!activePreset;
  const showingExisting = !showingUpload && !showingPreset && !!currentAvatarUrl && !isPresetUrl(currentAvatarUrl);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      data-testid="edit-profile-modal"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-lg shadow-elevated dark:shadow-elevated-dark p-6 mx-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Edit Profile
        </h2>

        {/* Avatar Preview */}
        <div className="flex justify-center mb-4">
          <div
            className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center text-3xl font-bold shrink-0"
            data-testid="avatar-preview"
          >
            {showingUpload ? (
              <img src={uploadPreview!} alt="Upload preview" className="w-full h-full object-cover" />
            ) : showingPreset ? (
              <div className={`w-full h-full ${getPresetById(activePreset!)?.color ?? "bg-slate-400"} flex items-center justify-center text-white`}>
                {username.charAt(0).toUpperCase()}
              </div>
            ) : showingExisting ? (
              <img src={currentAvatarUrl!} alt="Current avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-brand-600 dark:text-brand-400">
                {username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Preset Avatars */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Choose an avatar
          </label>
          <div className="flex gap-2 justify-center" data-testid="preset-avatars">
            {PRESET_AVATARS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset.id)}
                className={`w-10 h-10 rounded-full ${preset.color} flex items-center justify-center text-white text-sm font-bold transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
                  activePreset === preset.id ? "ring-2 ring-brand-600 ring-offset-2 dark:ring-offset-slate-900" : ""
                }`}
                aria-label={preset.label}
                data-testid={`preset-${preset.id}`}
              >
                {username.charAt(0).toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Upload */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Or upload a photo
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-500 dark:text-slate-400
              file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0
              file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700
              dark:file:bg-brand-900/20 dark:file:text-brand-300
              hover:file:bg-brand-100 dark:hover:file:bg-brand-900/30
              file:cursor-pointer file:transition-colors"
            data-testid="avatar-upload"
          />
        </div>

        {/* Display Name */}
        <div className="mb-4">
          <label htmlFor="display-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Display Name
          </label>
          <input
            id="display-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-2 focus:outline-brand-600 focus:border-brand-600 transition-colors"
            placeholder="Your display name"
            data-testid="input-display-name"
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-500 mb-4" data-testid="edit-error">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 transition-colors"
            data-testid="edit-cancel"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="px-4 py-2 rounded-md bg-brand-600 text-white font-medium hover:bg-brand-700 active:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            data-testid="edit-save"
          >
            {updateMutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
