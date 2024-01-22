import { PassThrough } from 'node:stream'

/**
 * Buffer stream items
 *
 * @param size Buffer size
 * @param objectMode buffer mode (`true` - object mode)
 *
 * Example:
 *
 * ```ts
 * _H([1, 2, 3, 4, 5])
 *  .map(fastProduser)
 *  .through(buffer(3, true))
 *  .map(slowTransformer)
 * ```
 */
export function buffer<T>(
  size: number,
  objectMode = false
): (source: Highland.Stream<T>) => Highland.Stream<T> {
  const passThroughBuffer = new PassThrough({
    highWaterMark: size,
    objectMode
  })

  return function (source$: Highland.Stream<T>): Highland.Stream<T> {
    return source$.through(passThroughBuffer)
  }
}
