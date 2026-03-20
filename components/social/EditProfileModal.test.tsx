import { render, screen, fireEvent } from "@testing-library/react";

// Mock tRPC
const mockUpdateMutate = jest.fn();
let mockUpdatePending = false;

jest.mock("@/lib/trpc/client", () => ({
  trpc: {
    profile: {
      updateProfile: {
        useMutation: (opts: { onSuccess?: () => void; onError?: (err: { message: string }) => void }) => ({
          mutate: (...args: unknown[]) => {
            mockUpdateMutate(...args);
            if (opts.onSuccess) opts.onSuccess();
          },
          isPending: mockUpdatePending,
        }),
      },
    },
  },
}));

import EditProfileModal from "@/components/social/EditProfileModal";

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  currentDisplayName: "Test User",
  currentAvatarUrl: null,
  username: "testuser",
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUpdatePending = false;
});

describe("EditProfileModal", () => {
  test("renders when open", () => {
    render(<EditProfileModal {...defaultProps} />);

    expect(screen.getByTestId("edit-profile-modal")).toBeInTheDocument();
    expect(screen.getByText("Edit Profile")).toBeInTheDocument();
  });

  test("does not render when closed", () => {
    render(<EditProfileModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByTestId("edit-profile-modal")).not.toBeInTheDocument();
  });

  test("shows display name input with current value", () => {
    render(<EditProfileModal {...defaultProps} />);

    const input = screen.getByTestId("input-display-name") as HTMLInputElement;
    expect(input.value).toBe("Test User");
  });

  test("shows 5 preset avatar options", () => {
    render(<EditProfileModal {...defaultProps} />);

    const presets = screen.getByTestId("preset-avatars");
    expect(presets).toBeInTheDocument();
    expect(screen.getByTestId("preset-preset-ruby")).toBeInTheDocument();
    expect(screen.getByTestId("preset-preset-emerald")).toBeInTheDocument();
    expect(screen.getByTestId("preset-preset-sapphire")).toBeInTheDocument();
    expect(screen.getByTestId("preset-preset-amber")).toBeInTheDocument();
    expect(screen.getByTestId("preset-preset-violet")).toBeInTheDocument();
  });

  test("shows file upload input", () => {
    render(<EditProfileModal {...defaultProps} />);

    expect(screen.getByTestId("avatar-upload")).toBeInTheDocument();
  });

  test("selecting a preset avatar updates preview", () => {
    render(<EditProfileModal {...defaultProps} />);

    fireEvent.click(screen.getByTestId("preset-preset-emerald"));

    // The preview should show — avatar-preview should be in the document
    expect(screen.getByTestId("avatar-preview")).toBeInTheDocument();
  });

  test("cancel button calls onClose", () => {
    const onClose = jest.fn();
    render(<EditProfileModal {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByTestId("edit-cancel"));

    expect(onClose).toHaveBeenCalled();
  });

  test("save button calls updateProfile with changed display name", () => {
    render(<EditProfileModal {...defaultProps} />);

    fireEvent.change(screen.getByTestId("input-display-name"), {
      target: { value: "New Name" },
    });
    fireEvent.click(screen.getByTestId("edit-save"));

    expect(mockUpdateMutate).toHaveBeenCalledWith(
      expect.objectContaining({ display_name: "New Name" })
    );
  });

  test("save button calls updateProfile with preset avatar", () => {
    render(<EditProfileModal {...defaultProps} />);

    fireEvent.click(screen.getByTestId("preset-preset-ruby"));
    fireEvent.click(screen.getByTestId("edit-save"));

    expect(mockUpdateMutate).toHaveBeenCalledWith(
      expect.objectContaining({ avatar_url: "preset:preset-ruby" })
    );
  });

  test("save with no changes calls onClose without mutation", () => {
    const onClose = jest.fn();
    render(<EditProfileModal {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByTestId("edit-save"));

    expect(mockUpdateMutate).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
