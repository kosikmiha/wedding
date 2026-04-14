const SUPPRESSED_KEY = 'wedding-confetti-suppressed'
/** Пасхалка confetti_create: тот же эффект, что в день свадьбы, сразу на сайте. */
const FORCE_ACTIVE_KEY = 'wedding-confetti-force-active'

const CHANGE_EVENT = 'wedding-confetti-preference-change'

function notifyChange() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

/** Пользователь отключил конфетти (пасхалка confetti_destroy). */
export function isWeddingConfettiSuppressed(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(SUPPRESSED_KEY) === '1'
  } catch {
    return false
  }
}

export function setWeddingConfettiSuppressed(suppressed: boolean): void {
  if (typeof window === 'undefined') return
  try {
    if (suppressed) {
      window.localStorage.setItem(SUPPRESSED_KEY, '1')
    } else {
      window.localStorage.removeItem(SUPPRESSED_KEY)
    }
    notifyChange()
  } catch {
    /* private mode / quota */
  }
}

/** Включён режим «как в день свадьбы» сразу (пасхалка confetti_create). */
export function isWeddingConfettiForceActive(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(FORCE_ACTIVE_KEY) === '1'
  } catch {
    return false
  }
}

export function setWeddingConfettiForceActive(active: boolean): void {
  if (typeof window === 'undefined') return
  try {
    if (active) {
      window.localStorage.setItem(FORCE_ACTIVE_KEY, '1')
    } else {
      window.localStorage.removeItem(FORCE_ACTIVE_KEY)
    }
    notifyChange()
  } catch {
    /* private mode / quota */
  }
}

export function subscribeWeddingConfettiPreference(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const run = () => cb()
  window.addEventListener(CHANGE_EVENT, run)
  window.addEventListener('storage', run)
  return () => {
    window.removeEventListener(CHANGE_EVENT, run)
    window.removeEventListener('storage', run)
  }
}

export function getWeddingConfettiSuppressedSnapshot(): boolean {
  return isWeddingConfettiSuppressed()
}

export function getWeddingConfettiForceActiveSnapshot(): boolean {
  return isWeddingConfettiForceActive()
}
