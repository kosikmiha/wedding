import { useLayoutEffect, useRef, useState } from 'react'

type Props = { flip?: boolean }

/** Координаты в path без «обрезки» до 4 знаков — иначе конец `A` не лежит на rx/ry и дуга чуть «плывёт» относительно плеча. */
function fmtCoord(n: number) {
  return String(Math.round(n * 1e6) / 1e6)
}

/**
 * Плечо до холма + дуга торца одним path; viewBox = размеру span (без растяжения дуги).
 * Левый торец: sweep=0 — внешняя дуга. Правый: sweep=1.
 * arcR = h + 1 (привязка к border); в path: правый радиус arcR − 0.5, левый arcR + 0.5 (зеркально по смыслу).
 */
export function WeddingBottomNavTopStroke({ flip }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setBox({ w: el.clientWidth, h: el.clientHeight })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { w, h } = box
  const arcR = h > 0 ? h + 1 : 0
  const r = arcR
  const rDrawRight = Math.max(0.25, r - 0.5)
  const rDrawLeft = r + 0.5
  const vbH = flip ? arcR : Math.max(arcR, rDrawLeft)
  /** Короче горизонталь к центру холма — сшивка с контуром WeddingNavHill (px с каждой стороны) */
  const shoulderInwardTrimPx = 22

  /** Укоротить дугу у нижнего конца (по длине дуги на окружности), px — не трогает горизонталь */
  const arcPerimeterTrim = 10
  /** Базовый угловой срез со стороны стыка; слева +1.5°, справа −0.5° к длине видимой дуги */
  const arcJointTrimDeg = 21
  const arcJointTrimDegLeft = arcJointTrimDeg + 1.5
  const arcJointTrimDegRight = arcJointTrimDeg - 0.5
  /* Правый торец: наружный конец на 0.5px левее — стык с вертикалью border */
  const wr = flip && w > 0 ? w - 0.5 : w
  let d = ''
  if (w > 0 && h > 0 && w >= arcR) {
    if (flip) {
      const delta = Math.min(
        arcPerimeterTrim / rDrawRight + (arcJointTrimDegRight * Math.PI) / 180,
        Math.PI / 2 - 1e-6,
      )
      if (wr >= arcR) {
        const cx = wr - rDrawRight
        const endX = cx + rDrawRight * Math.cos(delta)
        const endY = rDrawRight - rDrawRight * Math.sin(delta)
        /* внутренний конец плеча (к холму) был x=0 — отодвигаем на trim к центру навбара */
        const x0 = fmtCoord(shoulderInwardTrimPx)
        d = `M ${x0} 0 L ${wr - rDrawRight} 0 A ${rDrawRight} ${rDrawRight} 0 0 1 ${fmtCoord(endX)} ${fmtCoord(endY)}`
      }
    } else {
      const delta = Math.min(
        arcPerimeterTrim / rDrawLeft + (arcJointTrimDegLeft * Math.PI) / 180,
        Math.PI / 2 - 1e-6,
      )
      /* Зеркало правого wr: дуга на 0.5px правее — стык плеча с дугой (не хвост после дуги) */
      const arcL = arcR + 0.5
      if (w >= arcL) {
        const endX = arcL - rDrawLeft * Math.cos(delta)
        const endY = rDrawLeft - rDrawLeft * Math.sin(delta)
        const xInner = Math.max(arcL + 1e-6, w - shoulderInwardTrimPx)
        d = `M ${fmtCoord(xInner)} 0 L ${arcL} 0 A ${rDrawLeft} ${rDrawLeft} 0 0 0 ${fmtCoord(endX)} ${fmtCoord(endY)}`
      } else {
        const xInner = Math.max(arcR + 1e-6, w - shoulderInwardTrimPx)
        d = `M ${fmtCoord(xInner)} 0 L ${arcR} 0 A ${rDrawLeft} ${rDrawLeft} 0 0 0 0 ${rDrawLeft}`
      }
    }
  }

  return (
    <span
      ref={ref}
      aria-hidden
      className={`wedding-nav-top-stroke-side pointer-events-none absolute z-6 text-[color-mix(in_srgb,var(--border)_85%,transparent)] md:hidden ${
        flip ? 'wedding-nav-top-stroke-right' : 'wedding-nav-top-stroke-left'
      }`}
    >
      {d ? (
        <svg
          width={w}
          height={vbH}
          className="pointer-events-none block overflow-visible"
          viewBox={`0 0 ${w} ${vbH}`}
          fill="none"
          shapeRendering="geometricPrecision"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d={d}
            stroke="currentColor"
            strokeWidth={1}
            strokeLinecap="butt"
            strokeLinejoin="round"
            vectorEffect="nonScalingStroke"
          />
        </svg>
      ) : null}
    </span>
  )
}
