import { useTimerStore } from "@/lib/store/timerStore";

const getState = () => useTimerStore.getState();

describe("timerStore — Task 4.3", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    getState().reset();
  });

  afterEach(() => {
    getState().reset(); // clean up any running intervals
    jest.useRealTimers();
  });

  test("timer starts at 0 on new game", () => {
    getState().start();
    expect(getState().elapsed).toBe(0);
    expect(getState().isRunning).toBe(true);
  });

  test("pause() stops the timer", () => {
    getState().start();
    jest.advanceTimersByTime(3000);
    expect(getState().elapsed).toBe(3);

    getState().pause();
    jest.advanceTimersByTime(3000);
    expect(getState().elapsed).toBe(3); // still 3, not 6
    expect(getState().isPaused).toBe(true);
    expect(getState().isRunning).toBe(false);
  });

  test("resume() resumes the timer", () => {
    getState().start();
    jest.advanceTimersByTime(2000);
    expect(getState().elapsed).toBe(2);

    getState().pause();
    jest.advanceTimersByTime(5000); // paused, no ticking

    getState().resume();
    jest.advanceTimersByTime(2000);
    expect(getState().elapsed).toBe(4); // 2 before pause + 2 after resume
    expect(getState().isRunning).toBe(true);
    expect(getState().isPaused).toBe(false);
  });

  test("timer value persists through pause/resume cycle", () => {
    getState().start();
    jest.advanceTimersByTime(5000);
    getState().pause();
    const elapsedAtPause = getState().elapsed;

    getState().resume();
    jest.advanceTimersByTime(3000);
    expect(getState().elapsed).toBe(elapsedAtPause + 3);
  });

  test("stop() halts the timer permanently (completion)", () => {
    getState().start();
    jest.advanceTimersByTime(2000);
    expect(getState().elapsed).toBe(2);

    getState().stop();
    expect(getState().isStopped).toBe(true);
    expect(getState().isRunning).toBe(false);

    // resume should have no effect after stop
    getState().resume();
    jest.advanceTimersByTime(5000);
    expect(getState().elapsed).toBe(2);
    expect(getState().isRunning).toBe(false);
  });

  test("reset() clears all state", () => {
    getState().start();
    jest.advanceTimersByTime(5000);
    getState().reset();

    expect(getState().elapsed).toBe(0);
    expect(getState().isRunning).toBe(false);
    expect(getState().isPaused).toBe(false);
    expect(getState().isStopped).toBe(false);
  });

  test("start() after stop is a no-op", () => {
    getState().start();
    jest.advanceTimersByTime(2000);
    getState().stop();

    getState().start(); // should not restart because isStopped
    expect(getState().elapsed).toBe(2);
    expect(getState().isRunning).toBe(false);
  });

  test("tick() directly increments elapsed by 1", () => {
    getState().start();
    expect(getState().elapsed).toBe(0);
    getState().tick();
    expect(getState().elapsed).toBe(1);
    getState().tick();
    expect(getState().elapsed).toBe(2);
  });

  test("setElapsed sets a specific value (for hydration)", () => {
    getState().setElapsed(120);
    expect(getState().elapsed).toBe(120);
  });

  test("pause() is a no-op when not running", () => {
    getState().pause();
    expect(getState().isPaused).toBe(false);
    expect(getState().isRunning).toBe(false);
  });

  test("resume() is a no-op when not paused", () => {
    getState().start();
    getState().resume(); // already running, not paused
    expect(getState().isRunning).toBe(true);
  });
});
