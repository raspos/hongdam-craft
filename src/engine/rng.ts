/**
 * Seeded Deterministic PRNG (Mulberry32)
 * Guarantees 100% reproducible game events, counterfactual WHAT-IF replays,
 * and Monte Carlo simulations without external dependencies.
 */
export class SeededRNG {
  public state: number;

  constructor(seed: number) {
    this.state = (seed >>> 0) || 0x6d2b79f5;
  }

  /** Returns float in [0, 1) */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    this.state = this.state >>> 0;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns integer in [min, max] inclusive */
  int(min: number, max: number): number {
    const lo = Math.ceil(Math.min(min, max));
    const hi = Math.floor(Math.max(min, max));
    return Math.floor(this.next() * (hi - lo + 1)) + lo;
  }

  /** Picks one element from non-empty array */
  pick<T>(arr: readonly T[]): T {
    if (arr.length === 0) {
      throw new Error('Cannot pick from empty array');
    }
    return arr[Math.floor(this.next() * arr.length)];
  }

  /** Shuffles copy of array */
  shuffle<T>(arr: readonly T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  /** Probability check (0..1) */
  chance(prob: number): boolean {
    if (prob <= 0) return false;
    if (prob >= 1) return true;
    return this.next() < prob;
  }
}

export function createSeedFromString(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) || 123456789;
}
