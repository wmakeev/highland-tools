/* eslint-disable no-var */
import _H from 'highland'

export interface ThroughputProbeEvent {
  type: 'inbound' | 'outbound'
  label: string
  timeStart: number
  timeEnd: number
  size: number
}

export type ThroughputProbeHandler = (event: ThroughputProbeEvent) => void

var startWindowSymbol = Symbol('startWindowSymbol')
var endWindowSymbol = Symbol('endWindowSymbol')

// TODO Comments

/**
 * @param label measure label
 * @param maxSampleTime
 * @param maxSampleCount
 * @param handler
 */
export function throughputProbe<T>(
  label: string,
  maxSampleTime: number,
  maxSampleCount: number,
  handler: ThroughputProbeHandler
) {
  return (source: Highland.Stream<T>): Highland.Stream<T> => {
    var inboundBuffer = Array(maxSampleCount + 1) as T[]
    inboundBuffer[0] = 1 as T

    var inboundSampleStartTime = 0
    var inboundTimeout: NodeJS.Timeout | null = null

    var outboundSampleStartTime = 0
    var outboundSampleSize = 0

    const completeInboundSample = (
      push: (err: null, value: T[]) => void,
      isComplete: boolean
    ) => {
      if (inboundTimeout) {
        clearTimeout(inboundTimeout)
        inboundTimeout = null
      }

      if (inboundBuffer[0] === 1) return

      const size = (inboundBuffer[0] as number) - 1

      handler({
        type: 'inbound',
        label,
        timeStart: inboundSampleStartTime,
        timeEnd: performance.now(),
        size
      })

      inboundBuffer.length = size + 2
      inboundBuffer[0] = startWindowSymbol as T
      inboundBuffer[inboundBuffer.length] = endWindowSymbol as T

      push(null, inboundBuffer)

      if (isComplete) return

      inboundBuffer = Array(maxSampleCount + 1) as T[]
      inboundBuffer[0] = 1 as T

      inboundSampleStartTime = 0
    }

    return (
      source

        // inbound
        .consume<(T | symbol)[]>((err, it, push, next) => {
          // error
          if (err) {
            push(err)
            next()
          }

          // end of stream
          else if (it === _H.nil) {
            completeInboundSample(push, true)
            push(null, it as Highland.Nil)
          }

          // push data
          else {
            if (inboundSampleStartTime === 0) {
              inboundSampleStartTime = performance.now()
            }

            if ((inboundBuffer[0] as number) - 1 === maxSampleCount) {
              completeInboundSample(push, false)
            }
            //
            else if (inboundBuffer[0] === 1 && maxSampleTime !== 0) {
              inboundTimeout = setTimeout(() => {
                completeInboundSample(push, false)
              }, maxSampleTime)
            }

            inboundBuffer[(inboundBuffer[0] as number)++] = it as T

            next()
          }
        })

        .sequence()

        // outbound
        .consume<T>((err, it, push, next) => {
          // error
          if (err) {
            push(err)
            next()
          }

          // end of stream
          else if (it === _H.nil) {
            push(null, it as Highland.Nil)
          }

          // sample window start
          else if (it === startWindowSymbol) {
            outboundSampleStartTime = performance.now()
            next()
          }

          // sample window end
          else if (it === endWindowSymbol) {
            handler({
              type: 'outbound',
              label,
              timeStart: outboundSampleStartTime,
              timeEnd: performance.now(),
              size: outboundSampleSize
            })

            outboundSampleSize = 0

            next()
          }

          // push data
          else {
            outboundSampleSize++
            push(null, it as T)
            next()
          }
        })
    )
  }
}
