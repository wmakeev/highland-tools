import { defaultComparator } from '../tools/index.js'

/**
 * Pass down to stream only changed values
 *
 * @param comparator return true if a and b values is equal
 * (default is strict equal)
 */
export function changes<T>(
  comparator: (a: T, b: T) => boolean = defaultComparator
): (source: Highland.Stream<T>) => Highland.Stream<T> {
  return source => {
    let last: T | undefined = undefined

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
