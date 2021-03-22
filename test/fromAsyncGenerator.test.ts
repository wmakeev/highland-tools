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
  t.plan(3)

  const generator1 = async function* () {
    await wait(10)
    yield 0
  }

  let generator2started = false

  const generator2 = async function* (len: number) {
    generator2started = true

    for (let i = 1; i <= len; i++) {
      await wait(10)

      if (i === 4) throw new Error('Test error')

      yield i
    }
  }

  const stream1$ = _H(fromAsyncGenerator(() => generator1()))

  const stream2$ = _H(fromAsyncGenerator(() => generator2(5)))

  stream1$
    .tap(() => {
      t.equal(generator2started, false, 'should lazy start generator')
    })
    .concat(stream2$)
    .errors(err => {
      t.equal(err.message, 'Test error')
    })
    .toArray(arr => {
      t.deepEqual(arr, [0, 1, 2, 3])
      t.end()
    })
})
