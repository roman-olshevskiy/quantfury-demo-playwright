/** Values that occur more than once, each reported once per extra occurrence, in input order. */
export function findDuplicates<T>(values: readonly T[]): T[] {
  const seen = new Set<T>();
  return values.filter((value) => (seen.has(value) ? true : (seen.add(value), false)));
}
