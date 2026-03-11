import { createPRNG } from "@/lib/sudoku/prng";

describe("createPRNG", () => {
  it("same seed produces identical output sequence", () => {
    const a = createPRNG("test-seed");
    const b = createPRNG("test-seed");
    const seqA = Array.from({ length: 100 }, () => a.next());
    const seqB = Array.from({ length: 100 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it("different seeds produce different output sequences", () => {
    const a = createPRNG("seed-alpha");
    const b = createPRNG("seed-beta");
    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());
    expect(seqA).not.toEqual(seqB);
  });

  it("output is deterministic across 1000+ calls", () => {
    const a = createPRNG("determinism");
    const b = createPRNG("determinism");
    for (let i = 0; i < 1500; i++) {
      expect(a.next()).toBe(b.next());
    }
  });

  it("next() returns values in [0, 1)", () => {
    const rng = createPRNG("range-check");
    for (let i = 0; i < 1000; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("nextInt returns values within the specified range", () => {
    const rng = createPRNG("int-range");
    for (let i = 0; i < 500; i++) {
      const v = rng.nextInt(3, 7);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(7);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it("nextInt covers the full range over many calls", () => {
    const rng = createPRNG("coverage");
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) {
      seen.add(rng.nextInt(1, 9));
    }
    expect(seen.size).toBe(9);
  });

  it("shuffle is deterministic with the same seed", () => {
    const a = createPRNG("shuffle-test");
    const b = createPRNG("shuffle-test");
    const arrA = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const arrB = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    a.shuffle(arrA);
    b.shuffle(arrB);
    expect(arrA).toEqual(arrB);
  });

  it("shuffle rearranges elements", () => {
    const rng = createPRNG("shuffle-rearrange");
    const original = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const arr = [...original];
    rng.shuffle(arr);
    // Extremely unlikely to remain in order
    expect(arr).not.toEqual(original);
    // But contains the same elements
    expect(arr.sort((a, b) => a - b)).toEqual(original);
  });
});
