/** Секции одностраничника — общий список для нав, snap и анимаций */
export const WEDDING_SECTION_IDS = [
  'hero',
  'details',
  'story',
  'program',
  'rsvp',
] as const

export type WeddingSectionId = (typeof WEDDING_SECTION_IDS)[number]

/** Индекс секции по `#hash` в URL (или 0), для Swiper и нижнего меню */
export function weddingSectionIndexFromHash(hash?: string): number {
  const raw =
    hash ??
    (typeof globalThis !== 'undefined' && 'location' in globalThis
      ? globalThis.location.hash
      : '')
  const h = String(raw).replace(/^#/, '')
  const i = WEDDING_SECTION_IDS.indexOf(h as WeddingSectionId)
  return i >= 0 ? i : 0
}
