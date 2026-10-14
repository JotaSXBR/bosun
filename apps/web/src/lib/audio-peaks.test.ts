import { describe, expect, it } from "vitest";

import { fallbackPeaks, peaksFromChannel } from "./audio-peaks";

describe("peaksFromChannel", () => {
  it("normalizes the loudest bucket to 1", () => {
    const data = new Float32Array([0, 0.5, -0.5, 0, 0, 1, -1, 0]);
    const peaks = peaksFromChannel(data, 2);
    expect(peaks).toHaveLength(2);
    // Second bucket holds the ±1 impulse; |sample| makes sign irrelevant.
    expect(peaks[1]).toBe(1);
    expect(peaks[0]).toBe(0.5);
  });

  it("keeps a visible floor on quiet buckets", () => {
    const data = new Float32Array([1, 0, 0, 0, 0, 0, 0, 0.0001]);
    const peaks = peaksFromChannel(data, 2);
    expect(peaks[1]).toBe(0.15);
  });

  it("returns the fallback shape for silence and empty input", () => {
    expect(peaksFromChannel(new Float32Array(8), 4)).toEqual(fallbackPeaks(4));
    expect(peaksFromChannel(new Float32Array(0), 4)).toEqual(fallbackPeaks(4));
    expect(peaksFromChannel(new Float32Array(8), 0)).toEqual([]);
  });
});

describe("fallbackPeaks", () => {
  it("is deterministic and stays within 0..1", () => {
    const a = fallbackPeaks(40);
    expect(a).toEqual(fallbackPeaks(40));
    expect(a).toHaveLength(40);
    expect(a.every((p) => p >= 0 && p <= 1)).toBe(true);
  });
});
