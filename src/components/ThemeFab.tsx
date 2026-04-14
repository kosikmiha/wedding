import { AnimatePresence, motion } from 'motion/react'
import type { CSSProperties } from 'react'
import type { ThemePreference } from '../theme/context'
import { useTheme } from '../theme/use-theme'

const ICON_LG = 'size-7 shrink-0 block'
const ICON_SM = 'size-6 shrink-0 block'
const ICON_XS = 'size-5 shrink-0 block'
const ICON_XXS = 'size-4 shrink-0 block'
const ICON_MICRO = 'size-3 shrink-0 block'
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

type ThemeToggleSize = 'default' | 'compact' | 'minimal' | 'tiny' | 'micro'

/** Мобильный навбар: как MUI `outlined`; обводка через box-shadow — на круге ровнее, чем border. */
const THEME_TOGGLE_OUTLINED =
  'border-0 bg-transparent shadow-[0_0_0_1px_var(--border)] ring-0 backdrop-blur-none transition-[color,background-color,box-shadow] hover:shadow-[0_0_0_1px_var(--accent-border)] hover:bg-(--social-bg) hover:text-(--accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)'

type ThemeToggleButtonProps = {
  id?: string
  className?: string
  size?: ThemeToggleSize
  style?: CSSProperties
  /** Только для мобильной кнопки в навбаре — обводка без заливки (аналог MUI `outlined`). */
  variant?: 'outlined'
}

/** Кнопка переключения темы: десктопный FAB и мобильный вариант в навбаре. */
export function ThemeToggleButton({
  id,
  className,
  size = 'default',
  style,
  variant,
}: ThemeToggleButtonProps) {
  const { preference, cyclePreference } = useTheme()
  const presence = getIconPresenceMotion(preference)
  const iconCls =
    size === 'micro'
      ? ICON_MICRO
      : size === 'tiny'
        ? ICON_XXS
        : size === 'minimal'
          ? ICON_XS
          : size === 'compact'
            ? ICON_SM
            : ICON_LG

  const icon =
    preference === 'light' ? (
      <IconSun className={iconCls} />
    ) : preference === 'dark' ? (
      <IconMoon className={iconCls} />
    ) : (
      <IconSystem className={iconCls} />
    )

  const innerWrap =
    size === 'micro'
      ? 'size-3'
      : size === 'tiny'
        ? 'size-4'
        : size === 'minimal'
          ? 'size-5'
          : size === 'compact'
            ? 'size-6'
            : 'size-7'

  const variantClass = variant === 'outlined' ? THEME_TOGGLE_OUTLINED : ''

  return (
    <motion.button
      id={id}
      type="button"
      onClick={cyclePreference}
      aria-label={`Тема: ${label(preference)}. Нажмите, чтобы переключить`}
      title={`${label(preference)} — сменить тему`}
      className={[variantClass, className].filter(Boolean).join(' ')}
      style={style}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 500, damping: 32 }}
    >
      <span
        className={`relative flex ${innerWrap} items-center justify-center [&_svg]:mx-auto [&_svg]:my-auto`}
      >
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

export function ThemeFab() {
  return (
    <ThemeToggleButton
      id="theme-fab"
      className="fixed z-110 hidden size-14 items-center justify-center rounded-full border border-(--border) bg-[color-mix(in_srgb,var(--bg)_72%,transparent)] text-(--text-h) shadow-[0_10px_40px_rgba(0,0,0,0.12)] ring-1 ring-[color-mix(in_srgb,var(--text-h)_8%,transparent)] backdrop-blur-md transition-colors hover:border-(--accent-border) hover:text-(--accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) dark:shadow-[0_10px_40px_rgba(0,0,0,0.45)] dark:ring-[color-mix(in_srgb,#fff_6%,transparent)] sm:size-15 md:flex"
      style={{
        top: 'max(1rem, env(safe-area-inset-top, 0px))',
        right: 'max(1rem, env(safe-area-inset-right, 0px))',
      }}
    />
  )
}
