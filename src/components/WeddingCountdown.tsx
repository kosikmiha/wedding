import type { Dayjs } from 'dayjs'
import { motion } from 'motion/react'
import { getWeddingTimerParts } from '../wedding'

function pad(n: number) {
  return n.toString().padStart(2, '0')
}

/** Разделитель: две обычные точки в цвет цифр, без теней */
function CountdownSeparator() {
  return (
    <div className="countdown-separator" aria-hidden>
      <span className="countdown-separator__dot" />
      <span className="countdown-separator__dot" />
    </div>
  )
}

/* auto + умеренный gap-x — между «слипшимся» и старым 1fr примерно пополам */
const COUNTDOWN_GRID =
  'grid w-full max-w-[min(100%,56rem)] grid-cols-[auto_auto_auto_auto_auto_auto_auto] items-center justify-center justify-items-center gap-x-[clamp(0.22rem,0.95vw,0.55rem)]'

function CountdownDigits({
  days,
  h,
  m,
  s,
}: {
  days: number
  h: number
  m: number
  s: number
}) {
  return (
    <div className={COUNTDOWN_GRID}>
      <span className="lock-screen-digit select-none justify-self-center text-[clamp(2.75rem,12vw,5.5rem)] tabular-nums">
        {pad(days)}
      </span>
      <CountdownSeparator />
      <span className="lock-screen-digit select-none justify-self-center text-[clamp(2.5rem,11vw,5rem)] tabular-nums">
        {pad(h)}
      </span>
      <CountdownSeparator />
      <span className="lock-screen-digit select-none justify-self-center text-[clamp(2.5rem,11vw,5rem)] tabular-nums">
        {pad(m)}
      </span>
      <CountdownSeparator />
      <motion.span
        key={s}
        className="lock-screen-digit inline-block justify-self-center text-[clamp(2.5rem,11vw,5rem)] tabular-nums"
        initial={{ opacity: 0.45, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 26 }}
      >
        {pad(s)}
      </motion.span>

      <span className="mt-2 justify-self-center font-handwriting text-base text-(--accent) sm:text-lg">
        дней
      </span>
      <span className="mt-2" aria-hidden />
      <span className="mt-2 justify-self-center font-handwriting text-base text-(--accent) sm:text-lg">
        часов
      </span>
      <span className="mt-2" aria-hidden />
      <span className="mt-2 justify-self-center font-handwriting text-base text-(--accent) sm:text-lg">
        минут
      </span>
      <span className="mt-2" aria-hidden />
      <span className="mt-2 justify-self-center font-handwriting text-base text-(--accent) sm:text-lg">
        секунд
      </span>
    </div>
  )
}

export function WeddingCountdown({ now }: { now: Dayjs }) {
  const { phase, days, h, m, s } = getWeddingTimerParts(now)

  const titleBefore = 'До встречи осталось'
  /** Отсылка к «Клен ты мой опавший» — контраст осени и «вечной зелени» пары */
  const titleAfter = 'Не «клен опавший» — наша с тобой вечная весна'
  const subtitleAfterFirst =
    'Считаем мгновения от того «да», что прозвенело в полдень,'
  const subtitleAfterSecond =
    'дальше — только вперёд, без прощального шелеста берёз.'

  return (
    <div className="w-full max-w-[min(100%,56rem)] text-(--text-h)">
      {phase === 'before' ? (
        <p className="mb-8 font-handwriting text-2xl text-(--text-h) sm:text-3xl">
          {titleBefore}
        </p>
      ) : (
        <div className="mb-8 text-center">
          <p className="font-handwriting text-2xl text-(--text-h) sm:text-3xl">
            {titleAfter}
          </p>
          <p className="mt-3 max-w-xl text-pretty text-sm leading-relaxed text-(--text) sm:text-base">
            {subtitleAfterFirst}
          </p>
          <p className="mt-2 max-w-xl text-pretty text-sm leading-relaxed text-(--text) sm:text-base">
            {subtitleAfterSecond}
          </p>
        </div>
      )}
      <CountdownDigits days={days} h={h} m={m} s={s} />
    </div>
  )
}
