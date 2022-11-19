import _H from 'highland'

/**
 * Sort items in the stream without consuming all values for sorting.
 *
 * **IMPORTANT!**
 * - values should have natural number order (that returns by `sortBySelector`)
 * - order numbers sequence should not have gaps, that cause consuming all stream
 * before sorting
 *
 * > See the tests (`sortByNaturalOrder.test.ts`) for more detailed examples
 *
 * @param orderFrom First item order number
 * @param sortBySelector Selector returns item order number
 * @returns Stream ordered by item order number
 */
export function sortByNaturalOrder<T>(
  orderFrom: number,
  sortBySelector: (item: T) => number
) {
  return (stream$: Highland.Stream<T>): Highland.Stream<T> => {
    const itemsMap = new Map<number, T>()

    let lastItemOrder = orderFrom - 1

    return stream$.consume<T>((err, it, push, next) => {
      // error
      if (err) {
        push(err)
        next()
      }
      // stream end
      else if (it === _H.nil) {
        if (itemsMap.size > 0) {
          const sortedValues = [...itemsMap.values()].sort((a, b) => {
            return sortBySelector(a) - sortBySelector(b)
          })

          itemsMap.clear()

          for (const value of sortedValues) {
            push(null, value)
          }
        }

        push(null, _H.nil)
      }
      // next item
      else {
        const curItemOrder = sortBySelector(it as T)

        if (lastItemOrder + 1 === curItemOrder) {
          push(null, it as T)
          lastItemOrder++

          while (itemsMap.size > 0) {
            const nextItemOrder = lastItemOrder + 1
            const nextItem = itemsMap.get(nextItemOrder)

            if (nextItem !== undefined) {
              push(null, nextItem as T)
              itemsMap.delete(nextItemOrder)
              lastItemOrder++
            } else {
              break
            }
          }
        } else {
          itemsMap.set(curItemOrder, it as T)
        }

        next()
      }
    })
  }
}
