import _H from 'highland'
import assert from 'node:assert/strict'
import test from 'node:test'
import asyncTimers from 'node:timers/promises'
import {
  ThroughputProbeEvent,
  ThroughputProbeHandler,
  promiseToStream,
  throughputProbe
} from '../src/index.js'
// import { throughputProbe2 } from '../src/stream/throughputProbe2.js'

async function getResultSync(
  arr: any[],
  SAMPLE_SIZE: number,
  SAMPLE_TIME: number,
  handler: ThroughputProbeHandler
) {
  const result = await _H(arr)
    .map(it => {
      return it
    })

    .through(throughputProbe('Test sync', SAMPLE_TIME, SAMPLE_SIZE, handler))

    .map(it => {
      return it
    })

    .collect()
    .toPromise(Promise)

  return result
}

async function getResultAsync(
  arr: any[],
  SAMPLE_SIZE: number,
  SAMPLE_TIME: number,
  INBOUND_TIMEOUT: number,
  OUTBOUND_TIMEOUT: number,
  handler: ThroughputProbeHandler
) {
  const result = await _H(arr)
    .map(async it => {
      if (INBOUND_TIMEOUT) await asyncTimers.setTimeout(INBOUND_TIMEOUT)
      return it
    })
    .map(promiseToStream)
    .sequence()

    .through(throughputProbe('Test async', SAMPLE_TIME, SAMPLE_SIZE, handler))

    .map(async it => {
      if (OUTBOUND_TIMEOUT) await asyncTimers.setTimeout(OUTBOUND_TIMEOUT)
      return it
    })
    .map(promiseToStream)
    .sequence()

    .collect()
    .toPromise(Promise)

  return result
}

let ITEMS_COUNT = 0

let inboundItems: ThroughputProbeEvent[] = []
let outboundItems: ThroughputProbeEvent[] = []

const handler: ThroughputProbeHandler = ev => {
  const throughput = (ev.timeEnd - ev.timeStart) / ev.size

  console.log(
    `${ev.type === 'inbound' ? '🔽' : '🔼'} ${ev.label} ${ev.type} throughput ${throughput} ms/it`
  )

  if (ev.type === 'inbound') {
    inboundItems.push(ev)
  } else {
    outboundItems.push(ev)
  }
}

test.beforeEach(() => {
  inboundItems = []
  outboundItems = []
})

test.afterEach(() => {
  const inboundCount = inboundItems.reduce((res, it) => res + it.size, 0)
  const outboundCount = outboundItems.reduce((res, it) => res + it.size, 0)

  assert.equal(inboundCount, ITEMS_COUNT)
  assert.equal(outboundCount, ITEMS_COUNT)

  const inboundTime = inboundItems.reduce(
    (res, it) => res + it.timeEnd - it.timeStart,
    0
  )
  const outboundTime = outboundItems.reduce(
    (res, it) => res + it.timeEnd - it.timeStart,
    0
  )

  const inboundThroughputPerItem = inboundTime / ITEMS_COUNT
  const outboundThroughputPerItem = outboundTime / ITEMS_COUNT

  console.log(`🅿️ in throughput sync - ${inboundThroughputPerItem} ms/it`)
  console.log(`🅿️ out throughput sync - ${outboundThroughputPerItem} ms/it`)

  console.log(
    `🅿️ in/out throughput sync - ${inboundThroughputPerItem / outboundThroughputPerItem}`
  )

  ITEMS_COUNT = 0
})

test('throughputProbe (sync)', async () => {
  ITEMS_COUNT = 1000000

  const SAMPLE_SIZE = 50000
  const SAMPLE_TIME = 0

  const sampleArr = Array.from({ length: ITEMS_COUNT }, (_, i) => i + 1)

  performance.mark('start')
  const result = await getResultSync(
    sampleArr,
    SAMPLE_SIZE,
    SAMPLE_TIME,
    handler
  )
  performance.mark('end')

  const throughputPerItem =
    performance.measure('🅿️', 'start', 'end').duration / ITEMS_COUNT

  console.log(`🅿️ avg throughput sync - ${throughputPerItem} ms/it`)

  assert.equal(result.length, ITEMS_COUNT)
  assert.deepEqual(result, sampleArr)
})

test('throughputProbe (async)', async () => {
  ITEMS_COUNT = 5000

  const SAMPLE_SIZE = 500
  const SAMPLE_TIME = 0
  const INBOUND_TIMEOUT = 0
  const OUTBOUND_TIMEOUT = 0

  const sampleArr = Array.from({ length: ITEMS_COUNT }, (_, i) => i + 1)

  performance.mark('start')
  const result = await getResultAsync(
    sampleArr,
    SAMPLE_SIZE,
    SAMPLE_TIME,
    INBOUND_TIMEOUT,
    OUTBOUND_TIMEOUT,
    handler
  )
  performance.mark('end')

  const throughputPerItem =
    performance.measure('🅿️', 'start', 'end').duration / ITEMS_COUNT

  console.log(
    `🅿️ throughput async ${INBOUND_TIMEOUT} / ${OUTBOUND_TIMEOUT} - ${throughputPerItem} ms/it`
  )

  assert.equal(result.length, ITEMS_COUNT)
  assert.deepEqual(result, sampleArr)
})

test('throughputProbe (async + overhead)', async () => {
  ITEMS_COUNT = 500

  const SAMPLE_SIZE = 100
  const SAMPLE_TIME = 0
  const INBOUND_TIMEOUT = 5
  const OUTBOUND_TIMEOUT = 10

  const sampleArr = Array.from({ length: ITEMS_COUNT }, (_, i) => i + 1)

  performance.mark('start')
  const result = await getResultAsync(
    sampleArr,
    SAMPLE_SIZE,
    SAMPLE_TIME,
    INBOUND_TIMEOUT,
    OUTBOUND_TIMEOUT,
    handler
  )
  performance.mark('end')

  const throughputPerItem =
    performance.measure('🅿️', 'start', 'end').duration / ITEMS_COUNT

  console.log(
    `🅿️ throughput async ${INBOUND_TIMEOUT} / ${OUTBOUND_TIMEOUT} - ${throughputPerItem} ms/it`
  )

  assert.equal(result.length, ITEMS_COUNT)
  assert.deepEqual(result, sampleArr)
})

test('throughputProbe (async + overhead + timer)', async () => {
  ITEMS_COUNT = 2000

  const SAMPLE_SIZE = 300
  const SAMPLE_TIME = 300
  const INBOUND_TIMEOUT = 2
  const OUTBOUND_TIMEOUT = 1

  const sampleArr = Array.from({ length: ITEMS_COUNT }, (_, i) => i + 1)

  performance.mark('start')
  const result = await getResultAsync(
    sampleArr,
    SAMPLE_SIZE,
    SAMPLE_TIME,
    INBOUND_TIMEOUT,
    OUTBOUND_TIMEOUT,
    handler
  )
  performance.mark('end')

  const throughputPerItem =
    performance.measure('🅿️', 'start', 'end').duration / ITEMS_COUNT

  console.log(
    `🅿️ throughput async ${INBOUND_TIMEOUT} / ${OUTBOUND_TIMEOUT} - ${throughputPerItem} ms/it`
  )

  assert.equal(result.length, ITEMS_COUNT)
  assert.deepEqual(result, sampleArr)
})
