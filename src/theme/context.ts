import { createContext } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'

export const THEME_STORAGE_KEY = 'wedding-theme'

export type ThemeContextValue = {
  preference: ThemePreference
  setPreference: (p: ThemePreference) => void
  cyclePreference: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function readStored(): ThemePreference {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch {
    /* ignore */
  }
  return 'system'
}

export function applyDomTheme(preference: ThemePreference) {
  document.documentElement.setAttribute('data-theme', preference)
  const resolved =
    preference === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : preference
  document.documentElement.style.colorScheme = resolved
}
