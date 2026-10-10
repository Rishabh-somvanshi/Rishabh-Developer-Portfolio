/**
 * Visitor stats via GoatCounter — no cookies, no personal data, so no consent
 * banner. Loaded only on the live site: localhost and Netlify draft deploys
 * never request it, so testing can't pollute the numbers.
 *
 * What gets counted:
 *  - one page view per visit, always as "/" (the site is a single page);
 *  - where the visitor came from — a shared link's `?ref=<code>` tag wins over
 *    the browser's referrer, so "linkedin" / "naukri" / "email" show up by name;
 *  - a few named events (see `track` callers and `eventForLink`).
 *
 * To stop counting your own visits on a device, open the site once with
 * `#toggle-goatcounter` at the end of the address.
 */
export const LIVE_HOST = 'rishabh-somvanshi-developer.netlify.app'
export const COUNTER = 'https://rishabh6969.goatcounter.com/count'
const SCRIPT_SRC = 'https://gc.zgo.at/count.js'

/** The `?ref=` tag of a shared link as a short safe code (a–z, 0–9, - and _), or null. */
export function refFromSearch(search) {
  const raw = new URLSearchParams(search || '').get('ref') || ''
  const code = raw.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40)
  return code || null
}

/** The event name for a clicked link, or null for links not worth counting. */
export function eventForLink({ href, download = false }) {
  if (!href) return null
  if (download || /\.pdf($|\?)/i.test(href)) return 'resume-download'
  if (href.includes('wedding-command-centre-demo')) return 'open-wedding-demo'
  if (href.includes('expense-tracker')) return 'open-expense-tracker'
  if (href.startsWith('mailto:')) return 'contact-email'
  if (href.includes('linkedin.com')) return 'contact-linkedin'
  if (href.includes('github.com')) return 'contact-github'
  return null
}

// Events fired while count.js is still downloading (e.g. a visitor landing straight in the
// voyage) wait here and are sent when it loads. Capped: if the script is blocked they just drop.
const pending = []

/** Count a named event. Held until the counter has loaded; dropped if it never does. */
export function track(name) {
  const gc = typeof window !== 'undefined' ? window.goatcounter : null
  if (!gc) return
  if (typeof gc.count === 'function') gc.count({ path: name, title: name, event: true })
  else if (pending.length < 20) pending.push(name)
}

function flushPending() {
  pending.splice(0).forEach(track)
}

function onLinkClick(e) {
  const a = e.target && e.target.closest ? e.target.closest('a[href]') : null
  if (!a) return
  const name = eventForLink({ href: a.getAttribute('href') || '', download: a.hasAttribute('download') })
  if (name) track(name)
}

let listening = false

/** Start counting, on the live site only. Returns whether it did. */
export function initAnalytics({ hostname = window.location.hostname, search = window.location.search } = {}) {
  if (hostname !== LIVE_HOST) return false
  const ref = refFromSearch(search)
  pending.length = 0
  window.goatcounter = {
    path: () => '/', // one page, whatever the query string or tag
    ...(ref ? { referrer: ref } : {}),
  }
  const s = document.createElement('script')
  s.async = true
  s.src = SCRIPT_SRC
  s.dataset.goatcounter = COUNTER
  s.addEventListener('load', flushPending)
  document.head.appendChild(s)
  if (!listening) {
    // one listener for every link on the page; auxclick = middle-click "open in new tab"
    document.addEventListener('click', onLinkClick)
    document.addEventListener('auxclick', onLinkClick)
    listening = true
  }
  return true
}
