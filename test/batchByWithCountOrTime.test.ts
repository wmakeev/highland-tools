import test from 'tape'
import _H from 'highland'

import { batchByWithCountOrTime } from '../src'

// const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

test('batchByWithCountOrTime #1', t => {
  const values = [1, 1, 1, 2, 2, 1, 3]

  _H(values)
    .through(batchByWithCountOrTime(10, 0))
    .toArray(arr => {
      t.deepEqual(arr, [[1, 1, 1], [2, 2], [1], [3]])
      t.end()
    })
})

test('batchByWithCountOrTime #2', t => {
  const values = [1, 1, 1, 2, 2, 1, 3]

  _H(values)
    .through(batchByWithCountOrTime(2, 0))
    .toArray(arr => {
      t.deepEqual(arr, [[1, 1], [1], [2, 2], [1], [3]])
      t.end()
    })
})

test('batchByWithCountOrTime #3', t => {
  const values = [
    { foo: 1, bar: 1 },
    { foo: 1, bar: 2 },
    { foo: 2, bar: 3 },
    { foo: 2, bar: 4 },
    { foo: 1, bar: 5 },
    { foo: 3, bar: 6 }
  ]

  _H(values)
    .through(batchByWithCountOrTime(10, 0, (a, b) => a.foo === b.foo))
    .map(items => items.map(it => it.bar))
    .toArray(arr => {
      t.deepEqual(arr, [[1, 2], [3, 4], [5], [6]])
      t.end()
    })
})

test('batchByWithCountOrTime #4', t => {
  const values = [1, 1, 1, 2, 2, 1, 3]

  _H(values)
    .through(batchByWithCountOrTime(2, 0))
    .toArray(arr => {
      t.deepEqual(arr, [[1, 1], [1], [2, 2], [1], [3]])
      t.end()
    })
})
