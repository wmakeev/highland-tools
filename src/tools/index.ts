import _H from 'highland'

export const defaultComparator = <T>(a: T, b: T) => a === b

export const wait = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms))

// TODO Maybe fix native typings?
/**
 * To use in `.map(promiseToStream)` instead of `.map(it => _H(it))`
 * because `.map(_H)` is not preserve typings.
 *
 * @param p Promise
 * @returns Highland stream
 */
export const promiseToStream = <T>(p: Promise<T>) => _H(p)

/**
 * NonNullable type guard
 *
 * Use it in filter:
 *
 * ```ts
 * _H([1, 2, null, 3]).filter(isNotNull).toArray(result => {
 *   // No type error here
 *   const nums: number[] = result
 * })
 * ```
 * */
export const isNotNull = <T>(val: T): val is NonNullable<T> => {
  return val === null || val === undefined ? false : true
}

/**
 * Append field to object
 *
 * @param fieldName The field where to add data
 * @returns New object with appended field
 */
export const getFieldAppender =
  <Field extends string, Target, Value>(fieldName: Field) =>
  (target: Target, data: Value): Target & { [P in Field]: Value } => {
    // @ts-expect-error mute typing error
    return {
      ...target,
      [fieldName]: data
    }
  }
