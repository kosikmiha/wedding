import type { Swiper as SwiperType } from 'swiper'
import { WEDDING_SECTION_IDS } from './wedding-sections'

const N = WEDDING_SECTION_IDS.length
const EDGE_EPS_PX = 8
/** После последнего wheel смена секции возможна только когда «тишина» дольше этого окна */
const WHEEL_SETTLE_MS = 320

let swiperRef: SwiperType | null = null
/** Индекс совпадает с `WEDDING_SECTION_IDS` / слайдом Swiper */
let scrollEls: (HTMLElement | null)[] = Array.from({ length: N }, () => null)
let hitEls: (HTMLElement | null)[] = Array.from({ length: N }, () => null)

function getActiveIndex(): number {
  const s = swiperRef
  if (!s || s.destroyed) return -1
  return s.activeIndex
}

function getScrollEl(): HTMLElement | null {
  const i = getActiveIndex()
  if (i < 0 || i >= N) return null
  return scrollEls[i]
}

function getHitEl(): HTMLElement | null {
  const i = getActiveIndex()
  if (i < 0 || i >= N) return null
  return hitEls[i]
}

function pointInActiveHitArea(clientX: number, clientY: number) {
  const el = getHitEl()
  if (!el) return false
  const r = el.getBoundingClientRect()
  return (
    clientX >= r.left &&
    clientX <= r.right &&
    clientY >= r.top &&
    clientY <= r.bottom
  )
}

function wheelDeltaToPixels(e: WheelEvent, scrollEl: HTMLElement): number {
  let d = e.deltaY
  if (e.deltaMode === 1) d *= 16
  else if (e.deltaMode === 2) d *= scrollEl.clientHeight || 1
  return d
}

function getScrollMetrics() {
  const scrollEl = getScrollEl()
  if (!scrollEl) return { st: 0, max: 0 }
  const st = scrollEl.scrollTop
  const max = Math.max(0, scrollEl.scrollHeight - scrollEl.clientHeight)
  return { st, max }
}

/** Пока true — жест начался при промежуточной позиции скролла; смена слайда запрещена до отпускания */
let blockSwipeForCurrentPointerGesture = false

function syncBlockSwipeFromScrollStart() {
  const { st, max } = getScrollMetrics()
  blockSwipeForCurrentPointerGesture =
    st > EDGE_EPS_PX && st < max - EDGE_EPS_PX
}

function updateAllowTouchMove(clientY: number, startY: number) {
  const swiper = swiperRef
  const scrollEl = getScrollEl()
  if (!swiper || swiper.destroyed || !scrollEl) {
    if (swiper && !swiper.destroyed) swiper.allowTouchMove = true
    return
  }

  const { st, max } = getScrollMetrics()
  if (max <= EDGE_EPS_PX * 2) {
    swiper.allowTouchMove = true
    return
  }

  if (blockSwipeForCurrentPointerGesture) {
    swiper.allowTouchMove = false
    return
  }

  const diffY = clientY - startY

  if (diffY > 0 && st > EDGE_EPS_PX) {
    swiper.allowTouchMove = false
    return
  }
  if (diffY < 0 && st < max - EDGE_EPS_PX) {
    swiper.allowTouchMove = false
    return
  }
  swiper.allowTouchMove = true
}

let touchStartY = 0
let touchActive = false

function onTouchStart(e: TouchEvent) {
  touchActive = false
  const t = e.touches[0]
  if (!t) return
  if (!pointInActiveHitArea(t.clientX, t.clientY)) return
  const swiper = swiperRef
  if (!swiper || !getScrollEl()) return
  touchActive = true
  touchStartY = t.clientY
  syncBlockSwipeFromScrollStart()
}

function onTouchMove(e: TouchEvent) {
  if (!touchActive) return
  const t = e.touches[0]
  if (!t) return
  updateAllowTouchMove(t.clientY, touchStartY)
}

function onTouchEnd() {
  touchActive = false
  blockSwipeForCurrentPointerGesture = false
  if (swiperRef && !swiperRef.destroyed) swiperRef.allowTouchMove = true
}

let pointerStartY = 0
let pointerActiveId: number | null = null

function onPointerDown(e: PointerEvent) {
  if (e.pointerType !== 'touch') return
  pointerActiveId = null
  if (!pointInActiveHitArea(e.clientX, e.clientY)) return
  const swiper = swiperRef
  if (!swiper || !getScrollEl()) return
  pointerActiveId = e.pointerId
  pointerStartY = e.clientY
  syncBlockSwipeFromScrollStart()
}

function onPointerMove(e: PointerEvent) {
  if (e.pointerType !== 'touch') return
  if (pointerActiveId !== e.pointerId) return
  updateAllowTouchMove(e.clientY, pointerStartY)
}

function onPointerUp(e: PointerEvent) {
  if (e.pointerType !== 'touch') return
  if (pointerActiveId !== e.pointerId) return
  pointerActiveId = null
  blockSwipeForCurrentPointerGesture = false
  if (swiperRef && !swiperRef.destroyed) swiperRef.allowTouchMove = true
}

let installed = false

let wheelSessionActive = false
let wheelSettleTimer: ReturnType<typeof setTimeout> | null = null

function markWheelSession() {
  wheelSessionActive = true
  if (wheelSettleTimer) clearTimeout(wheelSettleTimer)
  wheelSettleTimer = setTimeout(() => {
    wheelSessionActive = false
    wheelSettleTimer = null
  }, WHEEL_SETTLE_MS)
}

function onWheelDocument(e: WheelEvent) {
  const swiper = swiperRef
  const scrollEl = getScrollEl()
  if (!swiper || swiper.destroyed || !scrollEl) return
  if (!pointInActiveHitArea(e.clientX, e.clientY)) return

  const st = scrollEl.scrollTop
  const max = Math.max(0, scrollEl.scrollHeight - scrollEl.clientHeight)
  const dy = wheelDeltaToPixels(e, scrollEl)
  const dominantVertical = Math.abs(e.deltaY) >= Math.abs(e.deltaX)
  if (!dominantVertical) return

  if (max <= EDGE_EPS_PX * 2) return

  const innerScrollsDown = dy > 0 && st < max - EDGE_EPS_PX
  const innerScrollsUp = dy < 0 && st > EDGE_EPS_PX

  if (innerScrollsDown || innerScrollsUp) {
    markWheelSession()
    e.preventDefault()
    e.stopPropagation()
    scrollEl.scrollTop = Math.min(max, Math.max(0, st + dy))
    return
  }

  if (wheelSessionActive) {
    e.preventDefault()
    e.stopPropagation()
    return
  }

  markWheelSession()
}

/**
 * Регистрирует capture-слушатели до монтирования Swiper (вызвать один раз из main).
 */
export function installSwiperNestedScrollTouchGuard() {
  if (installed || typeof document === 'undefined') return
  installed = true

  document.addEventListener('touchstart', onTouchStart, { capture: true, passive: true })
  document.addEventListener('touchmove', onTouchMove, { capture: true, passive: false })
  document.addEventListener('touchend', onTouchEnd, { capture: true, passive: true })
  document.addEventListener('touchcancel', onTouchEnd, { capture: true, passive: true })

  document.addEventListener('pointerdown', onPointerDown, { capture: true, passive: true })
  document.addEventListener('pointermove', onPointerMove, { capture: true, passive: false })
  document.addEventListener('pointerup', onPointerUp, { capture: true, passive: true })
  document.addEventListener('pointercancel', onPointerUp, { capture: true, passive: true })

  document.addEventListener('wheel', onWheelDocument, { capture: true, passive: false })
}

/** @deprecated используйте installSwiperNestedScrollTouchGuard */
export const installRsvpSwiperTouchGuard = installSwiperNestedScrollTouchGuard

/** Массивы длины `WEDDING_SECTION_IDS.length`: скролл внутри слайда и область попадания для жеста */
export function setNestedScrollTouchGuardContext(next: {
  swiper: SwiperType | null
  scrollEls: (HTMLElement | null)[]
  hitEls: (HTMLElement | null)[]
}) {
  swiperRef = next.swiper
  scrollEls = next.scrollEls
  hitEls = next.hitEls
}
