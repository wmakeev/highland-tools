import test from 'tape'
import _H from 'highland'

import { batchByWithCountOrTime, fromAsyncGenerator } from '../src/index.js'
import { wait } from '../src/tools/index.js'

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
  const generator = async function* () {
    const values = [1, 1, 1, 2, 2, 1, 3]

    for (const val of values) {
      yield val
      wait(50)
    }
  }

  _H(fromAsyncGenerator(() => generator()))
    .through(batchByWithCountOrTime(2, 0))
    .toArray(arr => {
      t.deepEqual(arr, [[1, 1], [1], [2, 2], [1], [3]])
      t.end()
    })
})

test('batchByWithCountOrTime #5', t => {
  const generator = async function* () {
    // (1)
    yield 1
    await wait(10)
    yield 1
    yield 1

    // (2)
    yield 1

    // (3)
    await wait(100)
    yield 1

    // (4)
    yield 2
    yield 2
    yield 2
    await wait(100)

    // (5)
    yield 3
    await wait(30)

    // (6)
    yield 4
    yield 4
    await wait(100)
  }

  _H(fromAsyncGenerator(() => generator()))
    .through(batchByWithCountOrTime(3, 50))
    .toArray(arr => {
      t.deepEqual(arr, [
        /* (1) */ [1, 1, 1],
        /* (2) */ [1],
        /* (3) */ [1],
        /* (4) */ [2, 2, 2],
        /* (5) */ [3],
        /* (6) */ [4, 4]
      ])
      t.end()
    })
})
