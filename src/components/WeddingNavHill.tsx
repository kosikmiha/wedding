import {
  type ReactNode,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { flushSync } from 'react-dom'
import {
  buildHillPathNormalized,
  buildHillSilhouetteStrokePathPx,
  estimateHillBoxFromViewport,
} from '../wedding-nav-hill-geometry'

type Props = {
  className?: string
  children: ReactNode
}

/** Опциональный холм с собственным клипом (десктоп / отладка); мобильный монолит использует общий контур. */
export function WeddingNavHill({ className, children }: Props) {
  const clipId = `wedding-nav-hill-${useId().replace(/:/g, '')}`
  const innerRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState(estimateHillBoxFromViewport)

  useLayoutEffect(() => {
    const el = innerRef.current
    if (!el) return

    const measure = (sync: boolean) => {
      const node = innerRef.current
      if (!node) return
      void node.offsetWidth
      const r = node.getBoundingClientRect()
      const w = r.width
      const h = r.height
      if (w < 1 || h < 1) return
      if (sync) {
        flushSync(() => setBox({ w, h }))
      } else {
        setBox((prev) => (prev.w === w && prev.h === h ? prev : { w, h }))
      }
    }

    measure(true)

    const ro = new ResizeObserver(() => measure(false))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const pathD =
    box.w > 0 && box.h > 0 ? buildHillPathNormalized(box.w, box.h) : ''
  const silhouetteStrokePx =
    box.w > 0 && box.h > 0
      ? buildHillSilhouetteStrokePathPx(box.w, box.h)
      : ''

  return (
    <div className="relative">
      <svg
        width={0}
        height={0}
        className="pointer-events-none absolute overflow-visible"
        aria-hidden
      >
        <defs>
          <clipPath id={clipId} clipPathUnits="objectBoundingBox">
            {pathD ? <path d={pathD} /> : null}
          </clipPath>
        </defs>
      </svg>
      <div
        ref={innerRef}
        className={
          pathD
            ? `${className} wedding-nav-hill-surface`.trim()
            : `${className} wedding-nav-hill-surface invisible`.trim()
        }
        style={
          pathD
            ? {
                clipPath: `url(#${clipId})`,
                WebkitClipPath: `url(#${clipId})`,
              }
            : undefined
        }
      >
        {children}
      </div>
      {silhouetteStrokePx ? (
        <svg
          width={box.w}
          height={box.h}
          className="pointer-events-none absolute top-0 left-0 z-6 block overflow-visible text-[color-mix(in_srgb,var(--border)_85%,transparent)]"
          viewBox={`0 0 ${box.w} ${box.h}`}
          fill="none"
          shapeRendering="geometricPrecision"
          aria-hidden
        >
          <path
            d={silhouetteStrokePx}
            stroke="currentColor"
            strokeWidth={1}
            strokeLinecap="butt"
            strokeLinejoin="round"
            vectorEffect="nonScalingStroke"
          />
        </svg>
      ) : null}
    </div>
  )
}
