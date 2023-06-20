import _H from 'highland'
import { defaultComparator } from '../tools'

export function batchByWithCountOrTime<T>(
  n: number,
  ms: number,
  comparator: (prev: T, next: T) => boolean = defaultComparator
): (source: Highland.Stream<T>) => Highland.Stream<T[]> {
  return source => {
    let prevValue: T | undefined = undefined
    let batched = [] as T[]
    let timeout: NodeJS.Timeout

    return source.consume<T[]>((err, nextValue, push, next) => {
      const pushBatch = () => {
        push(null, batched)
        prevValue = undefined
        batched = []
      }

      const resetBatchTimeout = () => {
        clearTimeout(timeout)
        timeout = setTimeout(pushBatch, ms)
      }

      const clearBatchTimeout = () => {
        clearTimeout(timeout)
      }

      if (err) {
        push(err)
        next()
      } else if (nextValue === _H.nil) {
        if (batched.length > 0) {
          push(null, batched)
          clearBatchTimeout()
        }

        push(null, _H.nil)
      } else {
        // first value in batch OR new equal value
        if (prevValue === undefined || comparator(prevValue, nextValue as T)) {
          // reset timeout for new batch
          if (prevValue === undefined) resetBatchTimeout()

          batched.push(nextValue as T)

          // batch by count
          if (batched.length === n) {
            pushBatch()
            clearBatchTimeout() // no need for timeout on empty batch
          } else {
            prevValue = nextValue as T
          }
        }
        // value changed
        else {
          if (batched.length > 0) {
            pushBatch()
            resetBatchTimeout()
          }

          batched = [nextValue as T]
          prevValue = nextValue as T
        }

        next()
      }
    })
  }
}
