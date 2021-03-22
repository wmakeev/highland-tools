import _H from 'highland'
import { defaultComparator } from '../tools'

/**
 * Batch only changed values
 *
 * @param comparator return true if a and b values is equal
 * (default is strict equal)
 */
export function batchBy<U>(
  comparator: (a: U, b: U) => boolean = defaultComparator
): (source: Highland.Stream<U>) => Highland.Stream<U[]> {
  return source => {
    let last: U | undefined = undefined
    let batch: U[] = []

    return source.consume<U[]>((err, it, push, next) => {
      if (err) {
        push(err)
        next()
      } else if (it === _H.nil) {
        push(null, batch)
        push(null, it)
        batch = []
      } else {
        if (last !== undefined && !comparator(last, it as U)) {
          const _tmp = batch
          batch = [it as U]
          push(null, _tmp)
        } else {
          batch.push(it as U)
        }
        last = it as U
        next()
      }
    })
  }
}
