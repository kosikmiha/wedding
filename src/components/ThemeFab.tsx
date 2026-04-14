import { AnimatePresence, motion } from 'motion/react'
import type { ThemePreference } from '../theme/context'
import { useTheme } from '../theme/use-theme'

const ICON = 'size-7 shrink-0 block'
const STROKE = 2 as const

function label(p: ThemePreference) {
  switch (p) {
    case 'light':
      return 'Светлая тема'
    case 'dark':
      return 'Тёмная тема'
    case 'system':
      return 'Как в системе'
  }
}

function IconSun({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function IconMoon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function IconSystem({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  )
}

/** Общий выход — одинаковый для всех, чтобы не путать с уже сменившимся `preference`. */
const iconExit = {
  opacity: 0,
  scale: 0.76,
  rotate: 22,
  transition: { duration: 0.13, ease: [0.4, 0, 0.2, 1] as const },
}

/** Общий spring для входа иконок темы (солнце / луна / система — одна семья). */
const themeIconSpring = {
  type: 'spring' as const,
  stiffness: 405,
  damping: 14,
  mass: 0.7,
}

function getIconPresenceMotion(pref: ThemePreference) {
  switch (pref) {
    case 'light':
      return {
        initial: {
          opacity: 0,
          scale: 0.38,
          rotate: -200,
          y: 5,
        },
        animate: {
          opacity: 1,
          scale: 1,
          rotate: 0,
          y: 0,
        },
        exit: iconExit,
        transition: {
          type: 'spring' as const,
          stiffness: 410,
          damping: 14,
          mass: 0.68,
        },
      }
    case 'dark':
      return {
        initial: {
          opacity: 0,
          scale: 0.4,
          rotate: 185,
          y: -6,
        },
        animate: {
          opacity: 1,
          scale: 1,
          rotate: 0,
          y: 0,
        },
        exit: iconExit,
        transition: {
          type: 'spring' as const,
          stiffness: 395,
          damping: 15,
          mass: 0.72,
        },
      }
    case 'system':
      return {
        initial: {
          opacity: 0,
          scale: 0.4,
          x: 0,
          y: 10,
          rotate: 0,
        },
        animate: {
          opacity: 1,
          scale: 1,
          x: 0,
          y: 0,
          rotate: 0,
        },
        exit: iconExit,
        transition: themeIconSpring,
      }
  }
}

export function ThemeFab() {
  const { preference, cyclePreference } = useTheme()
  const presence = getIconPresenceMotion(preference)

  const icon =
    preference === 'light' ? (
      <IconSun className={ICON} />
    ) : preference === 'dark' ? (
      <IconMoon className={ICON} />
    ) : (
      <IconSystem className={ICON} />
    )

  return (
    <motion.button
      id="theme-fab"
      type="button"
      onClick={cyclePreference}
      aria-label={`Тема: ${label(preference)}. Нажмите, чтобы переключить`}
      title={`${label(preference)} — сменить тему`}
      className="fixed z-110 flex size-14 items-center justify-center rounded-full border border-(--border) bg-[color-mix(in_srgb,var(--bg)_72%,transparent)] text-(--text-h) shadow-[0_10px_40px_rgba(0,0,0,0.12)] ring-1 ring-[color-mix(in_srgb,var(--text-h)_8%,transparent)] backdrop-blur-md transition-colors hover:border-(--accent-border) hover:text-(--accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) dark:shadow-[0_10px_40px_rgba(0,0,0,0.45)] dark:ring-[color-mix(in_srgb,#fff_6%,transparent)] sm:size-15"
      style={{
        top: 'max(1rem, env(safe-area-inset-top, 0px))',
        right: 'max(1rem, env(safe-area-inset-right, 0px))',
      }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 500, damping: 32 }}
    >
      <span className="relative flex size-7 items-center justify-center [&_svg]:mx-auto [&_svg]:my-auto">
        <AnimatePresence mode="sync" initial={false}>
          <motion.span
            key={preference}
            className="absolute inset-0 flex items-center justify-center [&_svg]:mx-auto [&_svg]:my-auto"
            initial={presence.initial}
            animate={presence.animate}
            exit={presence.exit}
            transition={presence.transition}
          >
            {icon}
          </motion.span>
        </AnimatePresence>
      </span>
    </motion.button>
  )
}
