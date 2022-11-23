import test from 'tape'
import _H from 'highland'
import { setTimeout } from 'node:timers/promises'
import { sortByNaturalOrder } from '../src'

test('sortByNaturalOrder', t => {
  t.plan(1)

  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9]

  _H(items)
    .through(sortByNaturalOrder(1, it => it))
    .collect()
    .each(result => {
      t.equal(result.join(), items.join())
    })
})

test('sortByNaturalOrder (async merge)', t => {
  t.plan(2)

  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9]

  const stream$ = _H(items)

  const observedEven$ = stream$.observe().filter(it => it % 2 === 0)

  const forkedOdd$ = stream$
    .fork()
    .filter(it => it % 2 !== 0)
    .batch(2)
    .map(async it => {
      await setTimeout(50)
      return it
    })
    .map(it => _H(it))
    .flatten()

  const startTime = Date.now()

  const orderedResult: number[] = []

  _H([observedEven$, forkedOdd$])
    .merge()
    .through(sortByNaturalOrder(1, it => it))
    .each(it => {
      orderedResult.push(it)
      console.log(`${Date.now() - startTime}ms - ${it}`)
    })
    .done(() => {
      t.equal(orderedResult.length, items.length)
      t.deepEqual(orderedResult, items)
    })
})

test.only('sortByNaturalOrder (compare)', t => {
  t.plan(4)

  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9]

  const stream$ = _H(items)

  const observed$ = stream$.observe().filter(it => it % 2 === 0)

  const forked$ = stream$
    .fork()
    .filter(it => it % 2 !== 0)
    .batch(2)
    .map(async it => {
      await setTimeout(50)
      return it
    })
    .map(it => _H(it))
    .flatten()

  const startTime = Date.now()

  const merged$ = _H([observed$, forked$]).merge()

  const mergedResult: number[] = []
  const mergeCase$ = merged$.fork()

  const sortResult: number[] = []
  const sortCase$ = merged$.fork().through(sortByNaturalOrder(1, it => it))

  mergeCase$
    .each(it => {
      mergedResult.push(it)
      console.log(`mergedResult: ${Date.now() - startTime}ms - ${it}`)
    })
    .done(() => {
      t.equal(mergedResult.length, items.length)
      t.deepEqual(mergedResult, [2, 1, 3, 4, 6, 5, 7, 8, 9])
    })

  sortCase$
    .each(it => {
      sortResult.push(it)
      console.log(`orderedResult: ${Date.now() - startTime}ms - ${it}`)
    })
    .done(() => {
      t.equal(sortResult.length, items.length)
      t.deepEqual(sortResult, items)
    })
})
