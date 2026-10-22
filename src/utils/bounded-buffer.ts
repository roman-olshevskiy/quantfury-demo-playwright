/**
 * Keeps the most recent `capacity` items and counts what was dropped. Used for diagnostics of a
 * live trading UI, which would otherwise accumulate an unbounded stream (requirements §19).
 */
export class BoundedBuffer<T> {
  readonly #capacity: number;
  readonly #items: T[] = [];
  #dropped = 0;

  constructor(capacity: number) {
    this.#capacity = capacity;
  }

  push(item: T): void {
    this.#items.push(item);
    if (this.#items.length > this.#capacity) {
      this.#items.shift();
      this.#dropped++;
    }
  }

  get size(): number {
    return this.#items.length;
  }

  get dropped(): number {
    return this.#dropped;
  }

  get items(): readonly T[] {
    return this.#items;
  }
}
