import test from 'tape'
import _H from 'highland'

import { fromAsyncGenerator } from '../src'
import { wait } from '../src/tools'

test('fromAsyncGenerator #1', t => {
  const generator = async function* (len: number) {
    for (let i = 1; i <= len; i++) {
      await wait(10)
      yield i
    }
  }

  _H(fromAsyncGenerator(() => generator(5))).toArray(arr => {
    t.deepEqual(arr, [1, 2, 3, 4, 5])
    t.end()
  })
})

test('fromAsyncGenerator #2', t => {
  t.plan(2)

  const generator = async function* (len: number) {
    for (let i = 1; i <= len; i++) {
      await wait(10)

      if (i === 4) throw new Error('Test error')

      yield i
    }
  }

  _H(fromAsyncGenerator(() => generator(5)))
    .errors(err => {
      t.equal(err.message, 'Test error')
    })
    .toArray(arr => {
      t.deepEqual(arr, [1, 2, 3])
      t.end()
    })
})
