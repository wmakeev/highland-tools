/**
 * Enrich source stream with other data
 *
 * Example:
 *
 * ```ts
 * const values = [{ a: 1 }, { a: 2 }, { a: 3 }]
 *
 * const add1 = (num: number) => num + 1
 *
 * _H(values)
 *   .through(
 *     enrich(
 *       it => it.a,
 *       src$ => src$.map(add1),
 *       (src, data) => {
 *         return {
 *           ...src,
 *           add: data
 *         }
 *       }
 *     )
 *   )
 * ```
 *
 * @param pick Maps source stream data to form applicable to `enrichmentData` transform
 * @param enrichmentDataTransform Transforms mapped by `pick` source stream to intermediate stream what will composed with source stream by `compose` function
 * @param compose Compose source stream items with intermediate stream items from `enrichmentDataTransform`
 * @returns Enriched stream
 */
export const enrich =
  <Src, Pick, Data, Res>(
    pick: (item: Src) => Pick,
    enrichmentDataTransform: (
      source$: Highland.Stream<Pick>
    ) => Highland.Stream<Data>,
    compose: (item: Src, data: Data) => Res
  ): ((source$: Highland.Stream<Src>) => Highland.Stream<Res>) =>
  source$ => {
    return source$
      .map(pick)
      .through(enrichmentDataTransform)
      .zip(source$.observe())
      .map(([data, src]) => compose(src, data))
  }
