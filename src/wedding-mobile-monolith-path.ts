import { buildHillSilhouetteStrokePathPx, fmtCoordPx } from './wedding-nav-hill-geometry'

function stripLeadingMoveTo(d: string): string {
  return d.replace(/^M\s+[\d.-]+\s+[\d.-]+\s+/i, '').trim()
}

function fmt(n: number) {
  return fmtCoordPx(n)
}

/**
 * Замкнутый внешний контур таблетки + холма в px (один path для clip и stroke).
 */
export function buildMobileMonolithOutlinePathPx(
  W: number,
  pillH: number,
  hillW: number,
  hillH: number,
): string {
  if (W < 32 || pillH < 8 || hillW < 8 || hillH < 8) return ''

  const R = pillH / 2
  const Htot = hillH + pillH
  const hillLeft = (W - hillW) / 2

  /* Таблетка должна вмещать скругления по бокам: внутренняя ширина ≥ hillW */
  if (hillLeft < R - 0.5 || hillW > W - 2 * R + 1) {
    return ''
  }

  const hillD = buildHillSilhouetteStrokePathPx(hillW, hillH, hillLeft)
  if (!hillD) return ''

  const hillRest = stripLeadingMoveTo(hillD)
  if (!hillRest.startsWith('C')) return ''

  const parts: string[] = []

  parts.push(`M ${fmt(R)} ${fmt(hillH)}`)

  if (hillLeft > R + 0.25) {
    parts.push(`L ${fmt(hillLeft)} ${fmt(hillH)}`)
  }

  parts.push(hillRest)

  parts.push(`L ${fmt(W - R)} ${fmt(hillH)}`)

  /* Правый верхний угол таблетки */
  parts.push(`A ${fmt(R)} ${fmt(R)} 0 0 1 ${fmt(W)} ${fmt(hillH + R)}`)
  parts.push(`L ${fmt(W)} ${fmt(Htot - R)}`)
  /* Правый нижний */
  parts.push(`A ${fmt(R)} ${fmt(R)} 0 0 1 ${fmt(W - R)} ${fmt(Htot)}`)
  /* Низ */
  parts.push(`L ${fmt(R)} ${fmt(Htot)}`)
  /* Левый нижний */
  parts.push(`A ${fmt(R)} ${fmt(R)} 0 0 1 ${fmt(0)} ${fmt(Htot - R)}`)
  /* Левая сторона */
  parts.push(`L ${fmt(0)} ${fmt(hillH + R)}`)
  /* Левый верхний */
  parts.push(`A ${fmt(R)} ${fmt(R)} 0 0 1 ${fmt(R)} ${fmt(hillH)}`)
  parts.push('Z')

  return parts.join(' ')
}
