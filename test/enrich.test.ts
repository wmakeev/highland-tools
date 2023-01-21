import test from 'tape'
import _H from 'highland'

import { enrich, getFieldAppender } from '../src'

test('enrich', t => {
  const values = [{ a: 1 }, { a: 2 }, { a: 3 }]

  _H(values)
    .through(
      enrich(
        it => it.a,
        src$ => src$.map(it => it + 1),
        (src, data) => {
          return {
            ...src,
            add: data
          }
        }
      )
    )
    .toArray(arr => {
      t.equal(arr.length, 3)

      t.equal(arr[0].a, 1)
      t.equal(arr[0].add, 2)

      t.deepEqual(arr, [
        { a: 1, add: 2 },
        { a: 2, add: 3 },
        { a: 3, add: 4 }
      ])

      t.end()
    })
})

test('enrich with field appender', t => {
  const values = [{ a: 1 }, { a: 2 }, { a: 3 }]

  const add1 = (num: number) => num + 1

  _H(values)
    .through(
      enrich(
        it => it.a,
        src$ => src$.map(add1),
        getFieldAppender('add')
      )
    )
    .toArray(arr => {
      t.equal(arr.length, 3)

      t.equal(arr[0].a, 1)
      t.equal(arr[0].add, 2)

      t.deepEqual(arr, [
        { a: 1, add: 2 },
        { a: 2, add: 3 },
        { a: 3, add: 4 }
      ])

      t.end()
    })
})
