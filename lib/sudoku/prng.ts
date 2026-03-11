/**
 * Deterministic seeded PRNG for puzzle generation.
 * Uses FNV-1a for string→uint32 hashing and mulberry32 for the PRNG.
 */

function hashSeed(seed: string): number {
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193); // FNV prime
  }
  return hash >>> 0; // ensure unsigned 32-bit
}

export interface PRNG {
  /** Returns a float in [0, 1) */
  next(): number;
  /** Returns an integer in [min, max] inclusive */
  nextInt(min: number, max: number): number;
  /** Shuffles an array in place (Fisher-Yates) */
  shuffle<T>(array: T[]): T[];
}

export function createPRNG(seed: string): PRNG {
  let state = hashSeed(seed);

  function next(): number {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function nextInt(min: number, max: number): number {
    return min + Math.floor(next() * (max - min + 1));
  }

  function shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = nextInt(0, i);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  return { next, nextInt, shuffle };
}
