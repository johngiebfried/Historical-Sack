/**
 * The content, as the game sees it: regions, scenes, and the order a player
 * meets them in. Pure functions over the data built from content/*.md.
 */

export const REGION_LETTERS = ['P', 'B', 'G', 'S', 'H']
export const QUALITIES = ['Violence', 'Piety', 'Plunder', 'Sacrilege']

export function makeContent(data) {
  const byId = new Map(data.questions.map((q) => [q.id, q]))

  /** The scene ids a player at this region and position meets, in order. Blachernae plays its unique scene second. */
  function sequence(region, position) {
    const r = data.regions[region]
    if (!r) throw new Error(`No region ${region}`)
    return r.order.map((s) => (s === 'U' ? `${region}-${position}` : `${region}-${s}`))
  }

  /** The ordinary positions of a region (1–6), plus its special path if it has one (the Golden Horn's 7). */
  function positions(region) {
    const r = data.regions[region]
    const list = Array.from({ length: r.positions }, (_, i) => i + 1)
    if (r.special) list.push(r.special)
    return list
  }

  function isSpecial(region, position) {
    return data.regions[region]?.special === position
  }

  function validSlot(region, position) {
    return Boolean(data.regions[region]) && positions(region).includes(position)
  }

  /** The shared scenes of a region: the ones that carry the four qualities. */
  function sharedIds(region) {
    return data.regions[region].order.filter((s) => s !== 'U').map((s) => `${region}-${s}`)
  }

  return {
    data,
    byId,
    regions: data.regions,
    question: (id) => byId.get(id),
    sequence,
    positions,
    isSpecial,
    validSlot,
    sharedIds,
  }
}
