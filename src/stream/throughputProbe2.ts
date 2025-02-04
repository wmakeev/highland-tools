import { ThroughputProbeDuplex } from '../tools/ThroughputProbeDuplex.js'
import { ThroughputProbeHandler } from './throughputProbe.js'

// FIXME Не проходит все тесты /test/throughputProbe.test.ts
/**
 * Работает примерно в 3 раза медленнее чем `throughputProbe`
 */
export function throughputProbe2<T>(
  label: string,
  maxSampleTime: number,
  maxSampleCount: number,
  handler: ThroughputProbeHandler,
  binaryMode = false
) {
  return (source$: Highland.Stream<T>): Highland.Stream<T> => {
    const throughputProbeDuplex = new ThroughputProbeDuplex({
      label,
      maxSampleWindowTime: maxSampleTime,
      highWaterMark: maxSampleCount,
      objectMode: binaryMode === false
    })

    throughputProbeDuplex.on('writeable:throughput', data => {
      handler({
        type: 'inbound',
        label,
        timeStart: data.timeStart,
        timeEnd: data.timeEnd,
        size: data.size
      })
    })

    throughputProbeDuplex.on('readable:throughput', data => {
      handler({
        type: 'outbound',
        label,
        timeStart: data.timeStart,
        timeEnd: data.timeEnd,
        size: data.size
      })
    })

    return source$.through(throughputProbeDuplex)
  }
}
