import test from 'tape'
import _H from 'highland'

import { orderlessParallel } from '../src/index.js'

test('orderlessParallel#1', t => {
  t.plan(1)

  const timeouts = [50, 50, 50, 50, 50, 50, 50, 50, 50, 50]

  const generator = function* () {
    for (let i = 0; i < timeouts.length; i++) {
      yield new Promise<number>(resolve =>
        setTimeout(() => resolve(i), timeouts[i])
      )
    }
  }

  _H(generator())
    .map(it => _H(it))
    .through(orderlessParallel(4))
    .toArray(arr => {
      t.deepEqual(arr, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
      t.end()
    })
})

test('orderlessParallel#2', t => {
  const LIMIT = 4

  t.plan(2)

  const timeouts = [300, 200, 100, 0, 50, 150, 250, 500, 125, 50, 0]

  let maxParallel = 0
  let parallel = 0

  const generator = function* () {
    for (let i = 0; i < timeouts.length; i++) {
      yield new Promise<number>(resolve => {
        parallel++

        if (parallel > maxParallel) maxParallel = parallel

        if (parallel > LIMIT) {
          t.fail(`parallel(${parallel}) > LIMIT(${LIMIT})`)
        }

        setTimeout(() => {
          parallel--

          resolve(i)
        }, timeouts[i])
      })
    }
  }

  _H(generator())
    .map(it => _H(it))
    .through(orderlessParallel(LIMIT))
    .toArray(arr => {
      t.equal([...new Set(arr)].length, timeouts.length)
      t.ok(maxParallel >= LIMIT - 1, 'should reach hight limit')
      t.end()
    })
})
