import _H from 'highland'
import { defaultComparator } from '../tools'

/**
 * Batch only changed values
 *
 * @param comparator return true if a and b values is equal
 * (default is strict equal)
 */
export function batchBy<T>(
  comparator: (a: T, b: T) => boolean = defaultComparator
): (source: Highland.Stream<T>) => Highland.Stream<T[]> {
  return source => {
    let last: T | undefined = undefined
    let batch: T[] = []

    return source.consume<T[]>((err, it, push, next) => {
      if (err) {
        push(err)
        next()
      } else if (it === _H.nil) {
        push(null, batch)
        push(null, it)
        batch = []
      } else {
        if (last !== undefined && !comparator(last, it as T)) {
          const _tmp = batch
          batch = [it as T]
          push(null, _tmp)
        } else {
          batch.push(it as T)
        }
        last = it as T
        next()
      }
    })
  }
}
