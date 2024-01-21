import test from 'tape'
import _H from 'highland'

import { count } from '../src/index.js'

test('count', t => {
  const values = [1, 2, 3, 4, 5, 6, 7]

  _H(values)
    .through(count)
    .toArray(arr => {
      t.deepEqual(arr, [7])
      t.end()
    })
})
