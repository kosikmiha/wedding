import { useLayoutEffect, useState, type RefObject } from 'react'

export type BottomNavPill = { left: number; top: number; width: number; height: number }

/** Позиция «таба» под активной ссылкой (как ink bar в Ant Design Tabs) */
export function useBottomNavPill(
  activeIndex: number,
  navRef: RefObject<HTMLElement | null>,
  linkRefs: RefObject<(HTMLElement | null)[]>,
  /** Смена мобилка/десктоп — другой `<nav>` у того же ref */
  layoutKey?: unknown,
): BottomNavPill {
  const [pill, setPill] = useState<BottomNavPill>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  })

  useLayoutEffect(() => {
    function measure() {
      const nav = navRef.current
      const link = linkRefs.current[activeIndex]
      if (!nav || !link) return
      const n = nav.getBoundingClientRect()
      const l = link.getBoundingClientRect()
      setPill({
        left: l.left - n.left - nav.clientLeft,
        top: l.top - n.top - nav.clientTop,
        width: l.width,
        height: l.height,
      })
    }

    measure()
    const fonts = typeof document !== 'undefined' ? document.fonts : undefined
    if (fonts?.ready) {
      void fonts.ready.then(measure)
    }

    const nav = navRef.current
    if (!nav) return
    const ro = new ResizeObserver(measure)
    ro.observe(nav)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [activeIndex, navRef, linkRefs, layoutKey])

  return pill
}
