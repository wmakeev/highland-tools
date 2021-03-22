import test from 'tape'
import _H from 'highland'

import { changes } from '../src'

test('changes #1', t => {
  const values = [1, 1, 1, 2, 2, 1, 3]

  _H(values)
    .through(changes())
    .toArray(arr => {
      t.deepEqual(arr, [1, 2, 1, 3])
      t.end()
    })
})

test('changes #2', t => {
  const values = [
    { foo: 1, bar: 1 },
    { foo: 1, bar: 2 },
    { foo: 2, bar: 3 },
    { foo: 2, bar: 4 },
    { foo: 1, bar: 5 },
    { foo: 3, bar: 6 }
  ]

  _H(values)
    .through(changes((a, b) => a.foo === b.foo))
    .map(it => it.bar)
    .toArray(arr => {
      t.deepEqual(arr, [1, 3, 5, 6])
      t.end()
    })
})
