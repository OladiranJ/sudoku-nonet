import { useThemeStore } from "@/lib/store/themeStore";

const getState = () => useThemeStore.getState();

describe("themeStore — Task 7.2", () => {
  beforeEach(() => {
    // Reset store and DOM
    getState().setTheme("light");
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    // Re-reset store to light with clean storage
    useThemeStore.setState({ theme: "light" });
  });

  test("default is light mode", () => {
    // Fresh store should default to light
    expect(getState().theme).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  test("toggle switches dark class on <html>", () => {
    getState().toggle();
    expect(getState().theme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    getState().toggle();
    expect(getState().theme).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  test("preference saved to localStorage", () => {
    getState().toggle();
    expect(localStorage.getItem("nonet:theme")).toBe("dark");

    getState().toggle();
    expect(localStorage.getItem("nonet:theme")).toBe("light");
  });

  test("on load, preference restored from localStorage", () => {
    // Simulate a saved dark preference
    localStorage.setItem("nonet:theme", "dark");

    // Hydrate should read from localStorage and apply
    getState().hydrate();
    expect(getState().theme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  test("hydrate defaults to light when no saved preference", () => {
    localStorage.clear();
    getState().hydrate();
    expect(getState().theme).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  test("setTheme applies the given theme directly", () => {
    getState().setTheme("dark");
    expect(getState().theme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("nonet:theme")).toBe("dark");
  });
});
