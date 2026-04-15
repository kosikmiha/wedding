import { useLayoutEffect, useRef, useState, type RefObject } from 'react'

export type BottomNavPill = { left: number; top: number; width: number; height: number }

export type UseBottomNavPillResult = {
  pill: BottomNavPill
  /**
   * После первого кадра с валидными координатами включаем transition (как в Ant Design Tabs).
   * До этого `none` — иначе с (0,0) подсветка «летит» к активному пункту при первом рендере.
   */
  pillTransitionsEnabled: boolean
}

/** Позиция «таба» под активной ссылкой (как ink bar в Ant Design Tabs) */
export function useBottomNavPill(
  activeIndex: number,
  navRef: RefObject<HTMLElement | null>,
  linkRefs: RefObject<(HTMLElement | null)[]>,
  /** Смена мобилка/десктоп — другой `<nav>` у того же ref */
  layoutKey?: unknown,
): UseBottomNavPillResult {
  const [pill, setPill] = useState<BottomNavPill>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  })
  const [pillTransitionsEnabled, setPillTransitionsEnabled] = useState(false)

  const layoutKeyRef = useRef(layoutKey)
  /** true только после inner rAF — иначе при быстром клике до rAF transition не включится навсегда */
  const pillMotionArmedRef = useRef(false)

  useLayoutEffect(() => {
    let scheduledA: number | undefined
    let scheduledB: number | undefined

    if (layoutKeyRef.current !== layoutKey) {
      layoutKeyRef.current = layoutKey
      pillMotionArmedRef.current = false
      queueMicrotask(() => setPillTransitionsEnabled(false))
    }

    function scheduleEnableTransitions() {
      if (pillMotionArmedRef.current) return
      cancelAnimationFrame(scheduledA ?? 0)
      cancelAnimationFrame(scheduledB ?? 0)
      scheduledA = requestAnimationFrame(() => {
        scheduledB = requestAnimationFrame(() => {
          pillMotionArmedRef.current = true
          setPillTransitionsEnabled(true)
        })
      })
    }

    function measure() {
      const nav = navRef.current
      const link = linkRefs.current[activeIndex]
      if (!nav || !link) return
      const n = nav.getBoundingClientRect()
      const l = link.getBoundingClientRect()
      const next = {
        left: l.left - n.left - nav.clientLeft,
        top: l.top - n.top - nav.clientTop,
        width: l.width,
        height: l.height,
      }
      setPill(next)
      if (next.width > 0 && next.height > 0) {
        scheduleEnableTransitions()
      }
    }

    measure()
    const fonts = typeof document !== 'undefined' ? document.fonts : undefined
    if (fonts?.ready) {
      void fonts.ready.then(measure)
    }

    const nav = navRef.current
    if (!nav) return () => {}
    const ro = new ResizeObserver(measure)
    ro.observe(nav)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
      cancelAnimationFrame(scheduledA ?? 0)
      cancelAnimationFrame(scheduledB ?? 0)
    }
  }, [activeIndex, navRef, linkRefs, layoutKey])

  return { pill, pillTransitionsEnabled }
}
