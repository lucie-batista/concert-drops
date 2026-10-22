/** Splits a list into consecutive groups of at most `size` items. */
export function chunk<T>(items: T[], size: number): T[][] {
  if (!Number.isInteger(size) || size < 1) {
    throw new RangeError(`Chunk size must be a positive integer: ${size}`);
  }
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}
