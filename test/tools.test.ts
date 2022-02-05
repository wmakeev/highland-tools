import test from 'tape'
import _H from 'highland'

import { promiseToStream } from '../src'

test('promiseToStream', async t => {
  const values = [1, 2, 3, 4, 5, 6, 7]

  const arr: number[] = await _H(values)
    .map(async num => {
      return num
    })
    .map(promiseToStream)
    .sequence()
    .collect()
    .toPromise(Promise)

  t.deepEqual(arr, values)

  // @ts-expect-error .map(_H) is not preserve typings
  const arr2: number[] = await _H(values)
    .map(async num => {
      return num
    })
    .map(_H)
    .sequence()
    .collect()
    .toPromise(Promise)

  t.deepEqual(arr2, values)
})
