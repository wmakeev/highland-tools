// Highland type hacks

/**
 * Just highland compact but with cast to NonNullable
 *
 * @param source Highland stream
 */
export function compact<T>(source: Highland.Stream<T>) {
  return source.compact() as unknown as Highland.Stream<NonNullable<T>>
}

export function append<U>(value: U) {
  return <T>(source: Highland.Stream<T>): Highland.Stream<T | U> => {
    // @ts-expect-error fix type union
    return source.append(value)
  }
}
