import type { Dayjs } from 'dayjs'
import dayjs from './lib/dayjs'

/** Момент начала свадьбы по Europe/Moscow (дата/время задаются здесь). */
export const WEDDING_INSTANT = dayjs.tz(
  '2026-07-09 12:20:00',
  'Europe/Moscow',
)

export type WeddingPhase = 'before' | 'after'

export function getWeddingPhase(now: Dayjs): WeddingPhase {
  return now.isBefore(WEDDING_INSTANT) ? 'before' : 'after'
}

const SEC_PER_DAY = 86400

export function getWeddingTimerParts(now: Dayjs) {
  const seconds = Math.abs(now.diff(WEDDING_INSTANT, 'second'))
  const days = Math.floor(seconds / SEC_PER_DAY)
  const h = Math.floor((seconds % SEC_PER_DAY) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return { phase: getWeddingPhase(now), days, h, m, s }
}

const MSK = 'Europe/Moscow'

/**
 * Конфетти: в день свадьбы — с момента WEDDING_INSTANT до конца суток по Москве;
 * в следующие годы — весь календарный день годовщины (месяц и число как у свадьбы).
 */
export function isWeddingConfettiPeriod(now: Dayjs): boolean {
  const msk = now.tz(MSK)
  const w = WEDDING_INSTANT.tz(MSK)
  if (msk.month() !== w.month() || msk.date() !== w.date()) return false

  const y = msk.year()
  const weddingYear = w.year()
  if (y < weddingYear) return false

  const endOfAnniversaryDay = msk.endOf('day')

  if (y === weddingYear) {
    return !now.isBefore(WEDDING_INSTANT) && !now.isAfter(endOfAnniversaryDay)
  }

  return true
}
