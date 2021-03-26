/**
 * Pass down to stream only changed values
 *
 * @param comparator return true if a and b values is equal
 * (default is strict equal)
 */
export function count<T>(source$: Highland.Stream<T>): Highland.Stream<number> {
  return source$.reduce(0, (res: number) => res + 1)
}
