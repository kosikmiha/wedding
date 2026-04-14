import { useEffect, useState } from 'react'
import { WEDDING_SECTION_IDS } from '../wedding-sections'

const SECTION_IDS = WEDDING_SECTION_IDS

/** При уходе секции с экрана увеличивает счётчик — анимации при следующем входе. */
export function useSectionReplay() {
  const [version, setVersion] = useState<Record<string, number>>(() =>
    Object.fromEntries(SECTION_IDS.map((id) => [id, 0])),
  )

  useEffect(() => {
    const visible = new Map<string, boolean>()

    const els = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => Boolean(el),
    )

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id
          const was = visible.get(id) ?? false
          const now = entry.isIntersecting
          if (was && !now) {
            setVersion((v) => ({ ...v, [id]: (v[id] ?? 0) + 1 }))
          }
          visible.set(id, now)
        }
      },
      /* −10px со всех сторон: «видимой» считается чуть меньшая область — при смене секций
         через нав выход и повторный вход ловятся стабильнее, чем при краю вьюпорта */
      { threshold: 0, rootMargin: '-10px' },
    )

    for (const el of els) {
      obs.observe(el)
    }

    return () => obs.disconnect()
  }, [])

  return version
}
