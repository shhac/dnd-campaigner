import { describe, it, expect } from "bun:test";
import { debounce } from "../lib/utils";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("debounce", () => {
  it("calls the function after the delay", async () => {
    let callCount = 0;
    const debounced = debounce(() => { callCount++; }, 50);

    debounced();
    expect(callCount).toBe(0);

    await wait(100);
    expect(callCount).toBe(1);
  });

  it("rapid calls only invoke once (last call wins)", async () => {
    const values: number[] = [];
    const debounced = debounce((n: number) => { values.push(n); }, 50);

    debounced(1);
    debounced(2);
    debounced(3);

    await wait(100);
    expect(values).toEqual([3]);
  });

  it("separate delayed calls each invoke", async () => {
    let callCount = 0;
    const debounced = debounce(() => { callCount++; }, 50);

    debounced();
    await wait(100);
    expect(callCount).toBe(1);

    debounced();
    await wait(100);
    expect(callCount).toBe(2);
  });
});
