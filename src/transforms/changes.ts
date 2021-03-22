import { defaultComparator } from '../tools'

/**
 * Pass down to stream only changed values
 *
 * @param comparator return true if a and b values is equal
 * (default is strict equal)
 */
export function changes<U>(
  comparator: (a: U, b: U) => boolean = defaultComparator
): (source: Highland.Stream<U>) => Highland.Stream<U> {
  return source => {
    let last: U | undefined = undefined

    return source
      .map(it => {
        if (last === undefined || !comparator(last, it)) {
          last = it
          return [it]
        } else {
          return []
        }
      })
      .sequence()
  }
}
