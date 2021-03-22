import _H from 'highland'

/**
 * Push values to stream from AsyncGenerator
 *
 * ```
 * const generator = async function* (len: number) {
 *   for (let i = 1; i <= len; i++) {
 *     await wait(10)
 *     yield i
 *   }
 * }
 *
 * _H(fromAsyncGenerator(() => generator(5)))
 *   .toArray(arr => {
 *     console.log(arr) // [1, 2, 3, 4, 5]
 *   })
 * ```
 *
 * @param factory Wrapper function that returns async generator.
 */
export function fromAsyncGenerator<T, R>(
  factory: () => AsyncGenerator<T, unknown, R>
) {
  let iter: AsyncGenerator<T, unknown, R>

  return _H<T>(async (push, next) => {
    if (!iter) {
      iter = factory()[Symbol.asyncIterator]()
    }

    let result

    try {
      result = await iter.next()
    } catch (err) {
      push(err)
      push(null, _H.nil)
      return
    }

    if (result.done) {
      // skip return value
      push(null, _H.nil)
      return
    } else {
      push(null, result.value)
      next()
      return
    }
  })
}
