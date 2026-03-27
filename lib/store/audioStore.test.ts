import { useAudioStore } from "@/lib/store/audioStore";

// Mock the sound functions so tests don't need AudioContext
jest.mock("@/lib/audio/sounds", () => ({
  playClickSound: jest.fn(),
  playChimeSound: jest.fn(),
}));

const getState = () => useAudioStore.getState();

describe("audioStore — Task 15.1", () => {
  beforeEach(() => {
    localStorage.clear();
    useAudioStore.setState({ enabled: false });
  });

  test("audio defaults to off", () => {
    expect(getState().enabled).toBe(false);
  });

  test("toggling audio saves preference to localStorage", () => {
    getState().toggle();
    expect(getState().enabled).toBe(true);
    expect(localStorage.getItem("nonet:audio")).toBe("true");

    getState().toggle();
    expect(getState().enabled).toBe(false);
    expect(localStorage.getItem("nonet:audio")).toBe("false");
  });

  test("preference restored on hydrate", () => {
    localStorage.setItem("nonet:audio", "true");
    getState().hydrate();
    expect(getState().enabled).toBe(true);
  });

  test("hydrate defaults to false when no saved preference", () => {
    localStorage.clear();
    getState().hydrate();
    expect(getState().enabled).toBe(false);
  });

  test("playClick calls playClickSound when enabled", () => {
    const { playClickSound } = require("@/lib/audio/sounds");
    useAudioStore.setState({ enabled: true });
    getState().playClick();
    expect(playClickSound).toHaveBeenCalled();
  });

  test("playClick does not call playClickSound when disabled", () => {
    const { playClickSound } = require("@/lib/audio/sounds");
    playClickSound.mockClear();
    useAudioStore.setState({ enabled: false });
    getState().playClick();
    expect(playClickSound).not.toHaveBeenCalled();
  });

  test("playChime calls playChimeSound when enabled", () => {
    const { playChimeSound } = require("@/lib/audio/sounds");
    useAudioStore.setState({ enabled: true });
    getState().playChime();
    expect(playChimeSound).toHaveBeenCalled();
  });

  test("playChime does not call playChimeSound when disabled", () => {
    const { playChimeSound } = require("@/lib/audio/sounds");
    playChimeSound.mockClear();
    useAudioStore.setState({ enabled: false });
    getState().playChime();
    expect(playChimeSound).not.toHaveBeenCalled();
  });
});
