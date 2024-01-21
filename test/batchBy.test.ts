import test from 'tape'
import _H from 'highland'

import { batchBy } from '../src/index.js'

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

test('batchBy #3', t => {
  const values = [] as string[]

  _H(values)
    .through(batchBy())
    .map(it => {
      t.fail('should never call with - ' + typeof it)
    })
    .toArray(arr => {
      t.ok(Array.isArray(arr))
      t.equal(arr.length, 0)
      t.end()
    })
})

test('batchBy #4', t => {
  const values = [undefined, undefined, undefined]

  _H(values)
    .through(batchBy())
    .toArray(arr => {
      t.ok(Array.isArray(arr))
      t.deepEqual(arr, [[undefined, undefined, undefined]])
      t.end()
    })
})

test('batchBy #5', t => {
  const values = [undefined, undefined, undefined, 1, 1, 2, null, null, 4, 4]

  _H(values)
    .through(batchBy())
    .toArray(arr => {
      t.ok(Array.isArray(arr))
      t.deepEqual(arr, [
        [undefined, undefined, undefined],
        [1, 1],
        [2],
        [null, null],
        [4, 4]
      ])
      t.end()
    })
})
