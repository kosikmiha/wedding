/**
 * Общая математика холма (клип + силуэт) для WeddingNavHill и мобильного монолита.
 */

export const THEME_BTN_HALF_PX = 12
export const HILL_TOP_RIM_EXTRA_PX = 5
export const ARC_R_PX = THEME_BTN_HALF_PX + HILL_TOP_RIM_EXTRA_PX
export const BTN_CY_PX = 6 + THEME_BTN_HALF_PX

export const HILL_WIDTH_VW_FRAC = 0.92
export const HILL_WIDTH_MAX_REM = 5.25

export function estimateHillBoxFromViewport(): { w: number; h: number } {
  if (typeof window === 'undefined') {
    return { w: 84, h: 36 }
  }
  const rootPx =
    parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
  const wPx = Math.min(
    window.innerWidth * HILL_WIDTH_VW_FRAC,
    HILL_WIDTH_MAX_REM * rootPx,
  )
  const hPx = 0.375 * rootPx + 0.125 * rootPx + 24
  return {
    w: Math.max(ARC_R_PX * 2 + 4, wPx),
    h: Math.max(8, Math.ceil(hPx)),
  }
}

function quarterEllipseCubics(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  quadrant: 'nw' | 'ne',
): string {
  const k = 0.5522847498
  if (quadrant === 'nw') {
    const x0 = cx - rx
    const y0 = cy
    const x3 = cx
    const y3 = cy - ry
    const c1x = x0
    const c1y = y0 - k * ry
    const c2x = cx - k * rx
    const c2y = y3
    return `C ${fmt(c1x)} ${fmt(c1y)} ${fmt(c2x)} ${fmt(c2y)} ${fmt(x3)} ${fmt(y3)}`
  }
  const y0 = cy - ry
  const x3 = cx + rx
  const y3 = cy
  const c1x = cx + k * rx
  const c1y = y0
  const c2x = x3
  const c2y = cy - k * ry
  return `C ${fmt(c1x)} ${fmt(c1y)} ${fmt(c2x)} ${fmt(c2y)} ${fmt(x3)} ${fmt(y3)}`
}

export function hillConcaveFlankControls(
  x1n: number,
  h: number,
  cyN: number,
): { baseTanX: number; lip: number } {
  const baseTanX = Math.min(0.125, Math.max(0.044, x1n * 0.46))
  const lipMax = Math.min(0.38, 0.97 - cyN)
  const lip = Math.min(lipMax, Math.max(15 / h, (1 - cyN) * 0.38))
  return { baseTanX, lip }
}

export function buildHillPathNormalized(w: number, h: number): string {
  if (w < ARC_R_PX * 2 + 4 || h < 8) return ''
  const cx = 0.5
  const cy = Math.min(BTN_CY_PX / h, 1 - 2 / h)
  const rx = ARC_R_PX / w
  const ry = ARC_R_PX / h

  const x1 = cx - rx
  const x2 = cx + rx

  const { baseTanX, lip } = hillConcaveFlankControls(x1, h, cy)

  return [
    `M 0 ${fmt(1)}`,
    `C ${fmt(baseTanX)} ${fmt(1)} ${fmt(x1)} ${fmt(cy + lip)} ${fmt(x1)} ${fmt(cy)}`,
    quarterEllipseCubics(cx, cy, rx, ry, 'nw'),
    quarterEllipseCubics(cx, cy, rx, ry, 'ne'),
    `C ${fmt(x2)} ${fmt(cy + lip)} ${fmt(1 - baseTanX)} ${fmt(1)} 1 ${fmt(1)} Z`,
  ].join(' ')
}

export function fmtCoordPx(n: number) {
  return String(Math.round(n * 1e6) / 1e6)
}

function fmt(n: number) {
  return String(Math.round(n * 10000) / 10000)
}

/**
 * Верхний контур холма в px. xOff — сдвиг по X (глобальные координаты монолита).
 */
export function buildHillSilhouetteStrokePathPx(
  w: number,
  h: number,
  xOff = 0,
): string {
  if (w < ARC_R_PX * 2 + 4 || h < 8) return ''
  const cyN = Math.min(BTN_CY_PX / h, 1 - 2 / h)
  const rxN = ARC_R_PX / w
  const cxN = 0.5
  const x1n = cxN - rxN
  const x2n = cxN + rxN
  const { baseTanX, lip } = hillConcaveFlankControls(x1n, h, cyN)

  const cyPx = cyN * h
  const x1px = x1n * w + xOff
  const x2px = x2n * w + xOff
  const cx = w / 2 + xOff
  const rx = ARC_R_PX
  const ry = ARC_R_PX
  const k = 0.5522847498
  const topY = cyPx - ry
  const nw_c1y = cyPx - k * ry
  const nw_c2x = cx - k * rx
  const ne_c1x = cx + k * rx
  const ne_c2y = cyPx - k * ry
  const yLip = (cyN + lip) * h

  return [
    `M ${fmtCoordPx(xOff)} ${fmtCoordPx(h)}`,
    `C ${fmtCoordPx(baseTanX * w + xOff)} ${fmtCoordPx(h)} ${fmtCoordPx(x1px)} ${fmtCoordPx(yLip)} ${fmtCoordPx(x1px)} ${fmtCoordPx(cyPx)}`,
    `C ${fmtCoordPx(x1px)} ${fmtCoordPx(nw_c1y)} ${fmtCoordPx(nw_c2x)} ${fmtCoordPx(topY)} ${fmtCoordPx(cx)} ${fmtCoordPx(topY)}`,
    `C ${fmtCoordPx(ne_c1x)} ${fmtCoordPx(topY)} ${fmtCoordPx(x2px)} ${fmtCoordPx(ne_c2y)} ${fmtCoordPx(x2px)} ${fmtCoordPx(cyPx)}`,
    `C ${fmtCoordPx(x2px)} ${fmtCoordPx(yLip)} ${fmtCoordPx((1 - baseTanX) * w + xOff)} ${fmtCoordPx(h)} ${fmtCoordPx(w + xOff)} ${fmtCoordPx(h)}`,
  ].join(' ')
}
