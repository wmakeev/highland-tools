/* eslint
  @typescript-eslint/ban-ts-comment: 0,
  @typescript-eslint/no-unused-vars: 0 */

import test from 'tape'
import _H from 'highland'

import { compact } from '../src'

test('types/compact', t => {
  const values = [1, null, 1, 2, null, 1, 3]

  const nullableStream$: Highland.Stream<number | null> = _H(values)

  // @ts-expect-error
  const standardNonNullableStream$: Highland.Stream<number> = nullableStream$
    .observe()
    .compact()

  const hackedNonNullableStream$: Highland.Stream<number> = nullableStream$
    .fork()
    .through(compact)

  hackedNonNullableStream$.toArray(arr => {
    t.deepEqual(arr, [1, 1, 2, 1, 3])
    t.end()
  })
})
