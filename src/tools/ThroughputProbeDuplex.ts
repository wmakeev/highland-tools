/* eslint-disable no-var */
import assert from 'node:assert/strict'
import internal, { Duplex } from 'node:stream'

var DEBUG = process.env['DEBUG']
var LOG_PAD = 25

// eslint-disable-next-line @typescript-eslint/no-unused-vars
var debug = (_: any) => {}
if (
  typeof DEBUG === 'string' &&
  DEBUG.split(',').includes('ThroughputProbeDuplex')
) {
  debug = console.log.bind(console)
}

export class ThroughputProbeDuplex extends Duplex {
  #writeWindowStart: number | null = null

  #writeBufferSizeOnWindowStart: number | null = null

  #readWindowStart: number | null = null

  #readBufferSizeOnWindowStart: number | null = null

  #label: string

  #maxSampleWindowSizeMs
  #sampleInterval

  /**
   * @param {internal.DuplexOptions & { label: string, maxSampleWindowTime?: number }} options
   */
  constructor(
    options: internal.DuplexOptions & {
      label: string
      maxSampleWindowTime?: number
    }
  ) {
    super(options)

    this.#label = options.label
    this.#maxSampleWindowSizeMs = options.maxSampleWindowTime ?? 1000

    this.cork()

    if (this.#maxSampleWindowSizeMs) {
      this.#sampleInterval = setInterval(() => {
        this.#emitSamples()
      }, this.#maxSampleWindowSizeMs)
    }
  }

  #emitSamples() {
    if (
      this.#writeWindowStart !== null &&
      performance.now() - this.#writeWindowStart >= this.#maxSampleWindowSizeMs
    ) {
      this.#closeWriteWindow()
    }

    if (
      this.#readWindowStart !== null &&
      performance.now() - this.#readWindowStart >= this.#maxSampleWindowSizeMs
    ) {
      this.#closeReadWindow()
    }
  }

  #finalize() {
    clearInterval(this.#sampleInterval)

    if (this.#readWindowStart !== null) {
      this.#closeReadWindow()
    }
  }

  #drainWriteable() {
    if (this.writableLength > 0) {
      debug('*️⃣ uncorking')
      this.uncork()

      debug('*️⃣ corking')
      this.cork()
    }
  }

  /**
   * Close writer stat and emit event
   */
  #closeWriteWindow() {
    if (this.#writeWindowStart === null) return
    assert.ok(this.#writeBufferSizeOnWindowStart !== null)

    const size = this.writableLength - this.#writeBufferSizeOnWindowStart

    const event = {
      label: this.#label,
      timeStart: this.#writeWindowStart,
      timeEnd: performance.now(),
      size
    }

    if (this.writableNeedDrain) {
      this.#writeWindowStart = null
      this.#writeBufferSizeOnWindowStart = null
    }

    //
    else {
      this.#writeWindowStart = performance.now()
      this.#writeBufferSizeOnWindowStart = this.writableLength
    }

    this.emit('writeable:throughput', event)
  }

  /**
   * Close reader stat and emit event
   */
  #closeReadWindow() {
    if (this.#readWindowStart === null) return
    assert.ok(this.#readBufferSizeOnWindowStart !== null)

    const event = {
      label: this.#label,
      timeStart: this.#readWindowStart,
      timeEnd: performance.now(),
      size: this.#readBufferSizeOnWindowStart - this.readableLength
    }

    if (this.readableLength > 0) {
      this.#readWindowStart = performance.now()
      this.#readBufferSizeOnWindowStart = this.readableLength
    }
    //
    else {
      this.#readWindowStart = null
      this.#readBufferSizeOnWindowStart = null

      if (this.writableNeedDrain) {
        this.#drainWriteable()
      }
    }

    this.emit('readable:throughput', event)
  }

  override _read(size: number) {
    debug(
      `🟢 _read size=${size}`.padEnd(LOG_PAD, ' ') +
        `(${this.writableLength} / ${this.readableLength})`
    )
  }

  override _writev(
    chunks: { chunk: any; encoding: BufferEncoding }[],
    cb: (error?: Error | null) => void
  ) {
    debug(
      `🟠 _writev(${chunks
        .map((/** @type {{ chunk: any; }} */ it: { chunk: any }) => it.chunk)
        .join(', ')})`.padEnd(LOG_PAD, ' ') +
        `(${this.writableLength} / ${this.readableLength})`
    )

    this.#closeWriteWindow()

    const size = this.writableLength

    assert.equal(chunks.length, size)

    this.once('readable', () => {
      if (this.#readWindowStart === null) {
        this.#readWindowStart = performance.now()
        this.#readBufferSizeOnWindowStart = size
      }
    })

    for (const it of chunks) {
      this.push(it.chunk, it.encoding)
    }

    cb()
  }

  override _final(cb: (error?: Error | null) => void) {
    debug('⏹️ _final')

    this.once('end', () => {
      this.#finalize()
    })

    this.once('error', () => {
      this.#finalize()
    })

    // Passing chunk as null signals the end of the stream (EOF), after which no
    // more data can be written.
    // Если не вызвать стрим не завершится - `Detected unsettled top-level await`
    // https://github.com/nodejs/node/blob/be9b614f58a63414dc9d62d36d6b535a8182d09b/lib/internal/streams/transform.js#L147
    this.push(null)

    cb?.()
  }

  /**
   * write(chunk: any, encoding?: BufferEncoding, cb?: (error: Error | null | undefined) => void): boolean;
   * @overload
   * @param {any} chunk
   * @param {BufferEncoding} [encoding]
   * @param {(error: Error | null | undefined) => void} [cb]
   * @returns {boolean}
   */

  /**
   * write(chunk: any, cb?: (error: Error | null | undefined) => void): boolean;
   * @overload
   * @param {any} chunk
   * @param {(error: Error | null | undefined) => void} [cb]
   * @returns {boolean}
   */

  override write(...args: any[]) {
    const writeResult = Duplex.prototype.write.call(
      this,
      // @ts-expect-error skip ts error
      ...args
    )

    if (this.#writeWindowStart === null) {
      this.#writeWindowStart = performance.now()
      this.#writeBufferSizeOnWindowStart = 0
    }

    // buffer is full
    if (writeResult === false) {
      process.nextTick(() => {
        this.#closeWriteWindow()

        if (this.readableLength === 0) {
          this.#drainWriteable()
        }
      })
    }

    return writeResult
  }

  override read(size?: number) {
    const readResult = Duplex.prototype.read.call(this, size)

    debug(
      `⤵️ read(${size ?? ''}) = ${readResult}`.padEnd(LOG_PAD, ' ') +
        `(${this.writableLength} / ${this.readableLength})`
    )

    if (size !== 0 && this.#readWindowStart !== null && readResult === null) {
      this.#closeReadWindow()
    }

    return readResult
  }
}
