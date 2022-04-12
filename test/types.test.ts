/* eslint
  @typescript-eslint/ban-ts-comment: 0,
  @typescript-eslint/no-unused-vars: 0 */

import test from 'tape'
import _H from 'highland'

import { compact, append } from '../src'

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

test('types/append', t => {
  t.plan(4)

  const values = [1, 2, 3]

  _H(values)
    .append(4)
    .toArray(nums => {
      t.deepEqual(nums, [1, 2, 3, 4])
    })

  _H(values)
    // @ts-expect-error should get standard typings error
    .append('four')
    .toArray(nums => {
      t.deepEqual(nums, [1, 2, 3, 'four'])
    })

  _H(values)
    .through(append(4))
    .toArray(nums => {
      t.deepEqual(nums, [1, 2, 3, 4])
    })

  _H(values)
    .through(append('four'))
    .toArray(nums => {
      const result: Exclude<typeof nums[number], number> = 'str'
      result

      t.deepEqual(nums, [1, 2, 3, 'four'])
    })
})
