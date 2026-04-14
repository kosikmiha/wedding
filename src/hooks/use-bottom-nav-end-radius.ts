import { type RefObject, useLayoutEffect } from 'react'

const MQ = '(max-width: 767px)'

/** На мобилке выставляет --wedding-nav-pill-r ≈ H/2 под реальный радиус таблетки (rounded-full). */
export function useBottomNavEndRadius(
  navRef: RefObject<HTMLElement | null>,
  /** Смена ветви мобилка/десктоп — другой DOM у `#wedding-bottom-nav` */
  layoutKey?: unknown,
) {
  useLayoutEffect(() => {
    const nav = navRef.current
    if (!nav) return

    const apply = () => {
      if (!window.matchMedia(MQ).matches) {
        nav.style.removeProperty('--wedding-nav-pill-r')
        return
      }
      const h = nav.getBoundingClientRect().height
      const r = Math.max(10, Math.round(h / 2))
      nav.style.setProperty('--wedding-nav-pill-r', `${r}px`)
    }

    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(nav)
    const mq = window.matchMedia(MQ)
    mq.addEventListener('change', apply)
    window.addEventListener('resize', apply)
    return () => {
      ro.disconnect()
      mq.removeEventListener('change', apply)
      window.removeEventListener('resize', apply)
    }
  }, [navRef, layoutKey])
}
