import { useLayoutEffect, useState } from 'react'

const MQ = '(max-width: 767px)'

/** Соответствует Tailwind `max-md` — мобильный навбар с холмом. */
export function useIsMaxMd(): boolean {
  const [match, setMatch] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(MQ).matches
      : false,
  )

  useLayoutEffect(() => {
    const mq = window.matchMedia(MQ)
    const apply = () => setMatch(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  return match
}
