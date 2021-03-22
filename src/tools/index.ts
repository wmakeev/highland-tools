export const defaultComparator = <T>(a: T, b: T) => a === b

export const wait = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms))
