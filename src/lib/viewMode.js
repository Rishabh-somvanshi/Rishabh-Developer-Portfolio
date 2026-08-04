/**
 * Which of the two views the app opens on.
 *
 * The dossier is the default: it is the fast view, and it is what a recruiter
 * following a link from a job application needs to see first. The voyage is
 * opt-in — chosen deliberately, deep-linked, or remembered from last visit.
 */

export const DOSSIER_HASHES = new Set([
  '#overview',
  '#experience',
  '#work',
  '#skills',
  '#contact',
])

export const VOYAGE_HASH = '#voyage'
export const STORAGE_KEY = 'rs.viewMode'

const MODES = new Set(['work', 'voyage'])

/**
 * Resolve the opening mode. Pure — callers supply the environment.
 *
 * Precedence, highest first:
 *   1. an explicit hash, so a pasted link always lands where it says
 *   2. reduced-motion, which rules out the voyage
 *   3. the visitor's remembered choice
 *   4. the dossier
 */
export function resolveInitialMode({ hash, stored, prefersReducedMotion }) {
  if (hash === VOYAGE_HASH) return 'voyage'
  if (DOSSIER_HASHES.has(hash)) return 'work'
  if (prefersReducedMotion) return 'work'
  if (MODES.has(stored)) return stored
  return 'work'
}

export function readStoredMode() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    return MODES.has(value) ? value : null
  } catch {
    return null // private mode, blocked storage — not worth failing over
  }
}

export function writeStoredMode(mode) {
  try {
    window.localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    /* ignore — persistence is a nicety, not a requirement */
  }
}
