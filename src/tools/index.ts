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
