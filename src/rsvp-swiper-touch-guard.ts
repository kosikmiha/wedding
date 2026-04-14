import type { Swiper as SwiperType } from 'swiper'

const RSVP_SLIDE_INDEX = 4
const EDGE_EPS_PX = 8
/** После последнего wheel смена секции возможна только когда «тишина» дольше этого окна */
const WHEEL_SETTLE_MS = 320

let swiperRef: SwiperType | null = null
let scrollElRef: HTMLElement | null = null
/** Вся секция «Ответ» (рамка слайда) — попадание по координатам, не только по target */
let hitAreaElRef: HTMLElement | null = null

function pointInRsvpHitArea(clientX: number, clientY: number) {
  const el = hitAreaElRef
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
  const scrollEl = scrollElRef
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
  const scrollEl = scrollElRef
  if (!swiper || swiper.destroyed || !scrollEl) return
  if (swiper.activeIndex !== RSVP_SLIDE_INDEX) {
    swiper.allowTouchMove = true
    return
  }

  if (blockSwipeForCurrentPointerGesture) {
    swiper.allowTouchMove = false
    return
  }

  const st = scrollEl.scrollTop
  const max = Math.max(0, scrollEl.scrollHeight - scrollEl.clientHeight)
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
  if (!pointInRsvpHitArea(t.clientX, t.clientY)) return
  const swiper = swiperRef
  if (!swiper || swiper.activeIndex !== RSVP_SLIDE_INDEX) return
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
  if (!pointInRsvpHitArea(e.clientX, e.clientY)) return
  const swiper = swiperRef
  if (!swiper || swiper.activeIndex !== RSVP_SLIDE_INDEX) return
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
  const scrollEl = scrollElRef
  if (!swiper || swiper.destroyed || !scrollEl) return
  if (swiper.activeIndex !== RSVP_SLIDE_INDEX) return
  if (!pointInRsvpHitArea(e.clientX, e.clientY)) return

  const st = scrollEl.scrollTop
  const max = Math.max(0, scrollEl.scrollHeight - scrollEl.clientHeight)
  const dy = wheelDeltaToPixels(e, scrollEl)
  const dominantVertical = Math.abs(e.deltaY) >= Math.abs(e.deltaX)
  if (!dominantVertical) return

  const innerScrollsDown = dy > 0 && st < max - EDGE_EPS_PX
  const innerScrollsUp = dy < 0 && st > EDGE_EPS_PX

  if (innerScrollsDown || innerScrollsUp) {
    markWheelSession()
    e.preventDefault()
    e.stopPropagation()
    scrollEl.scrollTop = Math.min(
      max,
      Math.max(0, st + dy),
    )
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
export function installRsvpSwiperTouchGuard() {
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

/** Секция «Ответ»: скролл, полигон секции, swiper */
export function setRsvpTouchGuardContext(next: {
  swiper: SwiperType | null
  scrollEl: HTMLElement | null
  hitAreaEl: HTMLElement | null
}) {
  swiperRef = next.swiper
  scrollElRef = next.scrollEl
  hitAreaElRef = next.hitAreaEl
}
