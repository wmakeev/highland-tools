// Highland type hacks

/**
 * Just highland compact but with cast to NonNullable
 *
 * @param source Highland stream
 */
export function compact<T>(source: Highland.Stream<T>) {
  return source.compact() as unknown as Highland.Stream<NonNullable<T>>
}
