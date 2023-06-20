import _H from 'highland'
import { defaultComparator } from '../tools'
import type { BatchComparator } from '../types'

const EMPTY = Symbol('Empty value')

const NIL = _H.nil

/**
 * Batch only changed values
 *
 * @param comparator return true if previous and current values is equal
 * (default is strict equal)
 */
export function batchBy<T>(
  comparator: BatchComparator<T> = defaultComparator
): (source: Highland.Stream<T>) => Highland.Stream<T[]> {
  return source => {
    let prevValue: T | typeof EMPTY = EMPTY
    let batch: T[] = []

    return source.consume<T[]>((err, nextValue, push, next) => {
      if (err) {
        push(err)
        next()
      } else if (nextValue === NIL) {
        if (batch.length > 0) push(null, batch)
        push(null, NIL)
        batch = []
      } else {
        if (prevValue !== EMPTY && !comparator(prevValue, nextValue as T)) {
          const _tmp = batch
          batch = [nextValue as T]
          push(null, _tmp)
        } else {
          batch.push(nextValue as T)
        }
        prevValue = nextValue as T
        next()
      }
    })
  }
}
