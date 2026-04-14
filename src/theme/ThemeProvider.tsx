import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  ThemeContext,
  THEME_STORAGE_KEY,
  applyDomTheme,
  readStored,
  type ThemePreference,
} from './context'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStored)

  useEffect(() => {
    applyDomTheme(preference)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, preference)
    } catch {
      /* ignore */
    }
  }, [preference])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== THEME_STORAGE_KEY || e.newValue == null) return
      const v = e.newValue
      if (v === 'light' || v === 'dark' || v === 'system') {
        setPreferenceState(v)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    if (preference !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyDomTheme('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [preference])

  const setPreference = useCallback((p: ThemePreference) => {
    setPreferenceState(p)
  }, [])

  const cyclePreference = useCallback(() => {
    const order: ThemePreference[] = ['light', 'dark', 'system']
    setPreferenceState((prev) => {
      const i = order.indexOf(prev)
      return order[(i + 1) % order.length]
    })
  }, [])

  const value = useMemo(
    () => ({ preference, setPreference, cyclePreference }),
    [preference, setPreference, cyclePreference],
  )

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  )
}
