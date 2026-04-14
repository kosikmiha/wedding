import type { Dayjs } from 'dayjs'
import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'
import Confetti from 'react-confetti'
import {
  getWeddingConfettiForceActiveSnapshot,
  getWeddingConfettiSuppressedSnapshot,
  subscribeWeddingConfettiPreference,
} from '../wedding-confetti-preference'
import { isWeddingConfettiPeriod } from '../wedding'

/** Совпадает с `tween-functions.linear` — без зависимости на типы пакета. */
function linearTween(t: number, b: number, end: number, d: number) {
  const c = end - b
  return (c * t) / d + b
}

const BURST_INTERVAL_MS = 480
const BURST_ROUNDS = 3
const BURST_COUNT = BURST_ROUNDS * 2
/** Узкий вьюпорт: слабее разброс в стороны, выше «фонтан», чтобы не вылетало за края */
const WIDE_CONFETTI_LAYOUT_PX = 1400

type ViewportSize = { width: number; height: number }

/** useSyncExternalStore: один и тот же объект, пока width/height не изменились (иначе бесконечный цикл). */
let viewportSnapshotCache: ViewportSize = { width: 0, height: 0 }

const VIEWPORT_SERVER_SNAPSHOT: ViewportSize = { width: 0, height: 0 }

function subscribeViewport(cb: () => void) {
  window.addEventListener('resize', cb)
  return () => window.removeEventListener('resize', cb)
}

function viewportSnapshot() {
  const width = window.innerWidth
  const height = window.innerHeight
  if (
    width !== viewportSnapshotCache.width ||
    height !== viewportSnapshotCache.height
  ) {
    viewportSnapshotCache = { width, height }
  }
  return viewportSnapshotCache
}

function viewportSnapshotServer() {
  return VIEWPORT_SERVER_SNAPSHOT
}

function useViewportSize() {
  return useSyncExternalStore(
    subscribeViewport,
    viewportSnapshot,
    viewportSnapshotServer,
  )
}

const REDUCED_MOTION_MQ = '(prefers-reduced-motion: reduce)'

function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION_MQ)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}

function reducedMotionSnapshot() {
  return window.matchMedia(REDUCED_MOTION_MQ).matches
}

function reducedMotionSnapshotServer() {
  return false
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    reducedMotionSnapshot,
    reducedMotionSnapshotServer,
  )
}

function suppressedSnapshotServer() {
  return false
}

function useWeddingConfettiSuppressed() {
  return useSyncExternalStore(
    subscribeWeddingConfettiPreference,
    getWeddingConfettiSuppressedSnapshot,
    suppressedSnapshotServer,
  )
}

function useWeddingConfettiForceActive() {
  return useSyncExternalStore(
    subscribeWeddingConfettiPreference,
    getWeddingConfettiForceActiveSnapshot,
    suppressedSnapshotServer,
  )
}

type Side = 'left' | 'right'

function SideBurstVolley({
  width,
  height,
  side,
}: {
  width: number
  height: number
  side: Side
}) {
  const wideLayout = width >= WIDE_CONFETTI_LAYOUT_PX
  /* Узкая полоса у нижнего левого / правого угла — «пушки» снизу вверх и внутрь экрана */
  const bandH = Math.max(56, height * 0.11)
  const bottomY = height - bandH
  const isLeft = side === 'left'
  const srcW = wideLayout ? 52 : 40

  const vxLeft = wideLayout
    ? { min: 14, max: 36 }
    : { min: 5, max: 14 }
  const vxRight = wideLayout
    ? { min: -36, max: -14 }
    : { min: -14, max: -5 }
  const vy = wideLayout
    ? { min: -42, max: -10 }
    : { min: -46, max: -22 }

  return (
    <Confetti
      width={width}
      height={height}
      recycle={false}
      numberOfPieces={wideLayout ? 140 : 120}
      tweenDuration={1}
      tweenFunction={linearTween}
      confettiSource={
        isLeft
          ? { x: -6, y: bottomY, w: srcW, h: bandH }
          : { x: width - srcW + 6, y: bottomY, w: srcW, h: bandH }
      }
      initialVelocityX={isLeft ? vxLeft : vxRight}
      initialVelocityY={vy}
      gravity={wideLayout ? 0.2 : 0.17}
      friction={0.987}
      wind={wideLayout ? 0.006 : 0.003}
      opacity={0.92}
    />
  )
}

function TopRain({
  width,
  height,
}: {
  width: number
  height: number
}) {
  const wideLayout = width >= WIDE_CONFETTI_LAYOUT_PX
  return (
    <Confetti
      width={width}
      height={height}
      recycle
      numberOfPieces={wideLayout ? 200 : 170}
      tweenDuration={4500}
      tweenFunction={linearTween}
      confettiSource={{ x: 0, y: 0, w: width, h: 0 }}
      initialVelocityX={wideLayout ? 5 : 2.2}
      initialVelocityY={{ min: 1, max: wideLayout ? 7 : 5 }}
      gravity={wideLayout ? 0.055 : 0.05}
      friction={0.993}
      wind={wideLayout ? 0.012 : 0.006}
      opacity={0.88}
    />
  )
}

/** С момента свадьбы до конца того дня и каждый год весь день годовщины — конфетти. */
export function WeddingConfetti({ now }: { now: Dayjs }) {
  const { width, height } = useViewportSize()
  const reducedMotion = usePrefersReducedMotion()
  const userSuppressed = useWeddingConfettiSuppressed()
  const userForceActive = useWeddingConfettiForceActive()
  const active = useMemo(
    () =>
      !reducedMotion &&
      !userSuppressed &&
      (isWeddingConfettiPeriod(now) || userForceActive),
    [now, reducedMotion, userSuppressed, userForceActive],
  )

  const [burstSlots, setBurstSlots] = useState<number[]>([])
  const [rainMode, setRainMode] = useState(false)

  useEffect(() => {
    if (!active) {
      setBurstSlots([])
      setRainMode(false)
      return
    }

    setBurstSlots([])
    setRainMode(false)

    const timers: ReturnType<typeof setTimeout>[] = []
    for (let i = 0; i < BURST_COUNT; i++) {
      timers.push(
        setTimeout(() => {
          setBurstSlots((prev) => (prev.includes(i) ? prev : [...prev, i]))
        }, i * BURST_INTERVAL_MS),
      )
    }
    timers.push(
      setTimeout(() => setRainMode(true), BURST_COUNT * BURST_INTERVAL_MS + 200),
    )

    return () => timers.forEach(clearTimeout)
  }, [active])

  useEffect(() => {
    if (!rainMode) return
    const t = setTimeout(() => setBurstSlots([]), 5200)
    return () => clearTimeout(t)
  }, [rainMode])

  if (!active || width < 1) return null

  return (
    <div
      className="pointer-events-none fixed inset-0 z-40"
      aria-hidden
    >
      {rainMode && (
        <div className="absolute inset-0 z-0">
          <TopRain width={width} height={height} />
        </div>
      )}
      {burstSlots.map((i) => {
        const side: Side = i % 2 === 0 ? 'left' : 'right'
        return (
          <div
            key={i}
            className="absolute inset-0 z-10"
          >
            <SideBurstVolley
              width={width}
              height={height}
              side={side}
            />
          </div>
        )
      })}
    </div>
  )
}
