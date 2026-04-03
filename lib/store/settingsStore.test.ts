import { useSettingsStore } from "@/lib/store/settingsStore";

const SETTINGS_KEY = "nonet:settings";

describe("settingsStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useSettingsStore.setState({
      highlightRowCol: true,
      highlightBox: true,
      highlightIdenticalNumbers: true,
    });
  });

  it("defaults to all highlights enabled", () => {
    const state = useSettingsStore.getState();
    expect(state.highlightRowCol).toBe(true);
    expect(state.highlightBox).toBe(true);
    expect(state.highlightIdenticalNumbers).toBe(true);
  });

  it("setHighlightRowCol updates state and persists to localStorage", () => {
    useSettingsStore.getState().setHighlightRowCol(false);
    expect(useSettingsStore.getState().highlightRowCol).toBe(false);

    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY)!);
    expect(saved.highlightRowCol).toBe(false);
  });

  it("setHighlightBox updates state and persists to localStorage", () => {
    useSettingsStore.getState().setHighlightBox(false);
    expect(useSettingsStore.getState().highlightBox).toBe(false);

    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY)!);
    expect(saved.highlightBox).toBe(false);
  });

  it("setHighlightIdenticalNumbers updates state and persists to localStorage", () => {
    useSettingsStore.getState().setHighlightIdenticalNumbers(false);
    expect(useSettingsStore.getState().highlightIdenticalNumbers).toBe(false);

    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY)!);
    expect(saved.highlightIdenticalNumbers).toBe(false);
  });

  it("hydrate restores saved settings from localStorage", () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      highlightRowCol: false,
      highlightBox: false,
      highlightIdenticalNumbers: true,
    }));

    useSettingsStore.getState().hydrate();

    const state = useSettingsStore.getState();
    expect(state.highlightRowCol).toBe(false);
    expect(state.highlightBox).toBe(false);
    expect(state.highlightIdenticalNumbers).toBe(true);
  });

  it("hydrate defaults to true when no saved settings exist", () => {
    localStorage.clear();
    useSettingsStore.setState({
      highlightRowCol: false,
      highlightBox: false,
      highlightIdenticalNumbers: false,
    });

    useSettingsStore.getState().hydrate();

    const state = useSettingsStore.getState();
    expect(state.highlightRowCol).toBe(true);
    expect(state.highlightBox).toBe(true);
    expect(state.highlightIdenticalNumbers).toBe(true);
  });

  it("toggling individual settings preserves others", () => {
    useSettingsStore.getState().setHighlightRowCol(false);
    useSettingsStore.getState().setHighlightBox(true);
    useSettingsStore.getState().setHighlightIdenticalNumbers(false);

    const state = useSettingsStore.getState();
    expect(state.highlightRowCol).toBe(false);
    expect(state.highlightBox).toBe(true);
    expect(state.highlightIdenticalNumbers).toBe(false);

    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY)!);
    expect(saved.highlightRowCol).toBe(false);
    expect(saved.highlightBox).toBe(true);
    expect(saved.highlightIdenticalNumbers).toBe(false);
  });
});
