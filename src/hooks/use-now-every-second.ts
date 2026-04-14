import type { Dayjs } from 'dayjs'
import { useEffect, useState } from 'react'
import dayjs from '../lib/dayjs'

/** Одно обновление времени в секунду — для таймера и смены фазы свадьбы. */
export function useNowEverySecond(): Dayjs {
  const [now, setNow] = useState<Dayjs>(() => dayjs())
  useEffect(() => {
    const id = window.setInterval(() => setNow(dayjs()), 1000)
    return () => window.clearInterval(id)
  }, [])
  return now
}
