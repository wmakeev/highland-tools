import test from 'tape'
import _H from 'highland'

import { batchBy } from '../src'

test('batchBy #1', t => {
  const values = [1, 1, 1, 2, 2, 1, 3]

  _H(values)
    .through(batchBy())
    .toArray(arr => {
      t.deepEqual(arr, [[1, 1, 1], [2, 2], [1], [3]])
      t.end()
    })
})

test('batchBy #2', t => {
  const values = [
    { foo: 1, bar: 1 },
    { foo: 1, bar: 2 },
    { foo: 2, bar: 3 },
    { foo: 2, bar: 4 },
    { foo: 1, bar: 5 },
    { foo: 3, bar: 6 }
  ]

  _H(values)
    .through(batchBy((a, b) => a.foo === b.foo))
    .map(items => items.map(it => it.bar))
    .toArray(arr => {
      t.deepEqual(arr, [[1, 2], [3, 4], [5], [6]])
      t.end()
    })
})
