/**
 * Count stream items
 */
export function count<T>(source$: Highland.Stream<T>): Highland.Stream<number> {
  return source$.reduce(0, (res: number) => res + 1)
}
