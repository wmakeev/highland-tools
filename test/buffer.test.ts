import _H from 'highland'
import { createReadStream } from 'node:fs'
import path from 'node:path'
import { setTimeout } from 'node:timers/promises'
import test from 'tape'

import { buffer, fromAsyncGenerator, promiseToStream } from '../src/index.js'

test('buffer #1', t => {
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9]

  _H(values)
    .through(buffer(2, true))
    .toArray(arr => {
      t.deepEqual(arr, values)
      t.end()
    })
})

test('buffer #2', t => {
  const values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

  let startTime = 0
  let yieldDuration = 0

  const sourceGen = async function* () {
    startTime = Date.now()

    for (const val of values) {
      yield val
      await setTimeout(10)
    }

    yieldDuration = Date.now() - startTime
  }

  fromAsyncGenerator(() => sourceGen())
    .through(buffer(3, true))
    .map(async val => {
      await setTimeout(50)
      return val
    })
    .map(promiseToStream)
    .sequence()
    .toArray(arr => {
      t.deepEqual(arr, values)

      t.ok(yieldDuration < 400)

      t.end()
    })
})

test('buffer #3', t => {
  t.plan(4)

  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9]

  const sourceGen = async function* () {
    for (const val of values) {
      yield val
      await setTimeout(30)
    }
  }

  fromAsyncGenerator(() => sourceGen())
    .map(val => {
      if (val === 3) throw new Error('Test error')
      return val
    })
    .through(buffer(3, true))
    .map(async val => {
      await setTimeout(10)
      return val
    })
    .map(promiseToStream)
    .sequence()
    .errors((err, push) => {
      t.ok(err instanceof Error)
      push(
        null,
        // @ts-expect-error err
        err
      )
    })

    .toArray(arr => {
      t.equals(arr.length, values.length)

      t.ok((arr[2] as unknown) instanceof Error)

      t.deepEqual(
        arr.filter(it => typeof it === 'number'),
        [1, 2, 4, 5, 6, 7, 8, 9]
      )

      t.end()
    })
})

test('buffer #4', async t => {
  const readStream = await createReadStream(
    path.join(process.cwd(), 'test/buffer.test.ts')
  )

  const result = await _H(readStream)
    .through(buffer(1024))
    .map(chunk => (chunk as Buffer).toString('utf8'))
    .collect()
    .toPromise(Promise)

  t.ok(Array.isArray(result))

  const text = result.join('')

  t.ok(text.startsWith('import'))
})
