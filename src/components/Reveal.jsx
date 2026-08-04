import { m } from 'framer-motion'

export const EASE = [0.21, 0.47, 0.32, 0.98]

export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
}

export const stagger = (delay = 0.08) => ({
  hidden: {},
  show: { transition: { staggerChildren: delay } },
})

/** Fade-up a block when it scrolls into view (once). */
export function Reveal({ as = 'div', children, className, delay = 0, ...rest }) {
  const Tag = m[as] || m.div
  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE, delay } },
      }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/** Section header: number · title · hairline · right note */
export function SectionHead({ num, title, note, id }) {
  return (
    <Reveal className="section-head">
      <span className="num" aria-hidden="true">
        {num}
      </span>
      <h2 id={id}>{title}</h2>
      <span className="rule" aria-hidden="true" />
      {note && <span className="note">{note}</span>}
    </Reveal>
  )
}

/* --- tiny stroke icons (no emoji, no icon library) --- */
export const IconDownload = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M8 2v8m0 0l3-3m-3 3L5 7M3 13h10" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const IconArrow = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M4.5 11.5l7-7m0 0H6m5.5 0V10" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const IconMail = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
    <rect x="2" y="3.5" width="12" height="9" rx="1.5" />
    <path d="M2.5 4.5L8 9l5.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
