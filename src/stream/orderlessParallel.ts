import _H from 'highland'

export function orderlessParallel(n: number) {
  return function <U>(
    source: Highland.Stream<Highland.Stream<U>>
  ): Highland.Stream<U> {
    let running = 0
    let ended = false
    let readingSource = false

    return _H((push, next) => {
      if (running < n && !ended && !readingSource) {
        // get another stream if not already waiting for one
        readingSource = true
        source.pull((err, x) => {
          readingSource = false
          if (err) {
            push(err)
          } else if (x === _H.nil) {
            ended = true
          } else if (!_H.isStream(x)) {
            push(new Error('Expected Stream, got ' + typeof x))
          } else {
            running++
            x.consume((_err, y, _push, _next) => {
              if (y === _H.nil) {
                running--
                next()
              } else {
                // push directly onto parallel output stream
                push(_err, y)
              }

              if (y !== _H.nil) {
                // keep reading until we hit nil
                _next()
              }
            }).resume()
          }
          // check if we need to get any more streams
          return next()
        })
      } else if (!running && ended) {
        // nothing more to do
        push(null, _H.nil)
      }
    })
  }
}
