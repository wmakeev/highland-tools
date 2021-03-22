import _H from 'highland'
import { defaultComparator } from '../tools'

export function batchByWithCountOrTime<T>(
  n: number,
  ms: number,
  comparator: (a: T, b: T) => boolean = defaultComparator
): (source: Highland.Stream<T>) => Highland.Stream<T[]> {
  return source => {
    let last: T | undefined = undefined
    let batched = [] as T[]
    let timeout: NodeJS.Timeout

    return source.consume<T[]>((err, it, push, next) => {
      const pushBatch = () => {
        push(null, batched)
        last = undefined
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
      } else if (it === _H.nil) {
        if (batched.length > 0) {
          push(null, batched)
          clearBatchTimeout()
        }

        push(null, _H.nil)
      } else {
        // first value in batch OR new equal value
        if (last === undefined || comparator(last, it as T)) {
          // reset timeout for new batch
          if (last === undefined) resetBatchTimeout()

          batched.push(it as T)

          // batch by count
          if (batched.length === n) {
            pushBatch()
            clearBatchTimeout() // no need for timeout on empty batch
          } else {
            last = it as T
          }
        }
        // value changed
        else {
          if (batched.length > 0) {
            pushBatch()
            resetBatchTimeout()
          }

          batched = [it as T]
          last = it as T
        }

        next()
      }
    })
  }
}
