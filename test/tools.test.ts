import test from 'tape'
import _H from 'highland'

import { promiseToStream, isNotNull, isNil } from '../src/index.js'

test('promiseToStream', async t => {
  const values = [1, 2, 3, 4, 5, 6, 7]

  const arr: number[] = await _H(values)
    .map(async num => {
      return num
    })
    .map(promiseToStream)
    .sequence()
    .collect()
    .toPromise(Promise)

  t.deepEqual(arr, values)

  // @ts-expect-error .map(_H) is not preserve typings
  const arr2: number[] = await _H(values)
    .map(async num => {
      return num
    })
    .map(_H)
    .sequence()
    .collect()
    .toPromise(Promise)

  t.deepEqual(arr2, values)
})

test('isNotNull', t => {
  t.plan(2)

  _H([1, 2, null, 3])
    .filter(it => it !== null)
    .toArray(result => {
      // @ts-expect-error Type error here
      const nums: number[] = result

      t.ok(nums.every(n => n !== null))
    })

  _H([1, 2, null, 3])
    .filter(isNotNull)
    .toArray(result => {
      // No type error here
      const nums: number[] = result

      t.ok(nums.every(n => n !== null))
    })
})

test('isNil', t => {
  t.plan(1)

  _H([1, 2, 3])
    .consume((err, it, push, next) => {
      // Error
      if (err) {
        // pass errors along the stream and consume next value
        push(err)
        next()
      }

      // End of stream
      else if (
        isNil(it) // it -> Highland.Nil | number
      ) {
        // pass nil (end event) along the stream
        push(null, it) // it -> Highland.Nil
      }

      // data item
      else {
        push(null, it) // it -> number
        next()
      }
    })
    .toArray(result => {
      t.deepEqual(result, [1, 2, 3])
    })
})
