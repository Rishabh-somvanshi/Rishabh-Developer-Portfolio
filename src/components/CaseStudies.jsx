import { studies } from '../data/content'
import { Reveal, SectionHead, IconArrow } from './Reveal'

/* ------------------------------------------------------------
   Stylized interface previews — drawn in the site's own design
   language (not screenshots). Pure shapes, token colors.
   ------------------------------------------------------------ */

function WeddingPreview() {
  const card = (x, y, w, h, hot = false) => (
    <g key={`${x}-${y}`}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="6"
        fill="var(--surface-2)"
        stroke={hot ? 'rgba(232,148,42,.55)' : 'var(--border)'}
      />
      <rect x={x + 10} y={y + 10} width="34" height="5" rx="2.5" fill={hot ? 'var(--accent)' : 'rgba(232,148,42,.35)'} />
      <rect x={x + 10} y={y + 22} width={w - 34} height="4" rx="2" fill="rgba(255,255,255,.14)" />
      <rect x={x + 10} y={y + 31} width={w - 58} height="4" rx="2" fill="rgba(255,255,255,.08)" />
    </g>
  )

  return (
    <svg viewBox="0 0 560 350" role="img" aria-label="Stylized preview of the Wedding Command Centre interface — kanban board, budget bars, and sidebar navigation">
      <rect width="560" height="350" fill="var(--surface)" />
      {/* sidebar */}
      <rect x="0" y="0" width="64" height="350" fill="var(--surface-2)" />
      <circle cx="32" cy="30" r="8" fill="var(--accent)" opacity=".9" />
      {[64, 88, 112, 136, 160, 184].map((y, i) => (
        <rect key={y} x="18" y={y} width="28" height="5" rx="2.5" fill={i === 1 ? 'rgba(232,148,42,.6)' : 'rgba(255,255,255,.12)'} />
      ))}
      {/* header */}
      <rect x="88" y="24" width="132" height="9" rx="4.5" fill="rgba(255,255,255,.25)" />
      <rect x="88" y="42" width="76" height="5" rx="2.5" fill="rgba(255,255,255,.1)" />
      <rect x="404" y="26" width="60" height="18" rx="9" fill="var(--accent-dim)" stroke="rgba(232,148,42,.4)" />
      <rect x="472" y="26" width="60" height="18" rx="9" fill="var(--surface-2)" stroke="var(--border)" />
      {/* budget bars */}
      <g>
        {[
          [88, 118, 150],
          [88, 132, 104],
          [88, 146, 128],
        ].map(([x, y, w], i) => (
          <g key={y}>
            <rect x={x} y={y} width="176" height="7" rx="3.5" fill="rgba(255,255,255,.07)" />
            <rect x={x} y={y} width={w} height="7" rx="3.5" fill={i === 0 ? 'var(--accent)' : 'rgba(232,148,42,.35)'} opacity={i === 0 ? 0.85 : 1} />
          </g>
        ))}
        <rect x="284" y="118" width="248" height="35" rx="6" fill="var(--surface-2)" stroke="var(--border)" />
        <rect x="296" y="130" width="52" height="6" rx="3" fill="rgba(255,255,255,.16)" />
        <rect x="452" y="128" width="68" height="10" rx="4" fill="rgba(232,148,42,.5)" />
      </g>
      {/* kanban columns */}
      {[88, 240, 392].map((x, col) => (
        <g key={x}>
          <rect x={x} y="176" width="60" height="6" rx="3" fill="rgba(255,255,255,.18)" />
          <rect x={x + 128} y="174" width="14" height="10" rx="5" fill="var(--surface-2)" stroke="var(--border)" />
        </g>
      ))}
      {card(88, 196, 140, 46)}
      {card(88, 250, 140, 46)}
      {card(88, 304, 140, 38)}
      {card(240, 196, 140, 46, true)}
      {card(240, 250, 140, 46)}
      {card(392, 196, 140, 46)}
      {card(392, 250, 140, 38)}
    </svg>
  )
}

function ExpensePreview() {
  const bars = [46, 72, 38, 88, 58, 96, 66, 110]
  return (
    <svg viewBox="0 0 560 350" role="img" aria-label="Stylized preview of the Expense Tracker interface — monthly bar chart, category donut, and expense list">
      <rect width="560" height="350" fill="var(--surface)" />
      {/* phone */}
      <rect x="52" y="26" width="182" height="298" rx="18" fill="var(--surface-2)" stroke="var(--border-strong)" />
      <rect x="118" y="38" width="50" height="5" rx="2.5" fill="rgba(255,255,255,.14)" />
      <rect x="72" y="62" width="58" height="5" rx="2.5" fill="rgba(255,255,255,.12)" />
      <rect x="72" y="76" width="104" height="14" rx="5" fill="rgba(255,255,255,.24)" />
      {/* mini bars in phone */}
      {bars.map((h, i) => (
        <rect
          key={i}
          x={72 + i * 18}
          y={170 - h * 0.55}
          width="10"
          height={h * 0.55}
          rx="3"
          fill={i === bars.length - 1 ? 'var(--accent)' : 'rgba(255,255,255,.13)'}
        />
      ))}
      <rect x="72" y="178" width="142" height="1" fill="var(--border)" />
      {/* list rows in phone */}
      {[196, 228, 260, 292].map((y, i) => (
        <g key={y}>
          <circle cx="80" cy={y + 6} r="5" fill={i === 0 ? 'var(--accent)' : 'rgba(255,255,255,.16)'} />
          <rect x="94" y={y} width="66" height="5" rx="2.5" fill="rgba(255,255,255,.16)" />
          <rect x="94" y={y + 9} width="40" height="4" rx="2" fill="rgba(255,255,255,.07)" />
          <rect x="182" y={y + 2} width="32" height="6" rx="3" fill="rgba(255,255,255,.2)" />
        </g>
      ))}
      {/* donut */}
      <g transform="translate(390 118)">
        <circle r="56" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="16" />
        <circle
          r="56"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="16"
          strokeDasharray="132 220"
          strokeLinecap="round"
          transform="rotate(-90)"
          opacity=".85"
        />
        <circle
          r="56"
          fill="none"
          stroke="rgba(232,148,42,.3)"
          strokeWidth="16"
          strokeDasharray="66 286"
          strokeLinecap="round"
          transform="rotate(62)"
        />
      </g>
      {/* legend */}
      {[204, 228, 252].map((y, i) => (
        <g key={y}>
          <rect x="318" y={y} width="10" height="10" rx="3" fill={['var(--accent)', 'rgba(232,148,42,.35)', 'rgba(255,255,255,.14)'][i]} />
          <rect x="338" y={y + 2} width={[92, 68, 80][i]} height="6" rx="3" fill="rgba(255,255,255,.13)" />
          <rect x="472" y={y + 2} width="34" height="6" rx="3" fill="rgba(255,255,255,.2)" />
        </g>
      ))}
      <rect x="318" y="286" width="196" height="1" fill="var(--border)" />
      <rect x="318" y="300" width="130" height="6" rx="3" fill="rgba(255,255,255,.1)" />
    </svg>
  )
}

const VISUALS = { wedding: WeddingPreview, expense: ExpensePreview }

function Study({ s, flip }) {
  const Visual = VISUALS[s.visual]
  return (
    <Reveal className={`study${flip ? ' flip' : ''}`}>
      <div>
        <span className="mono study-label">Case study {s.id}</span>
        <h3>{s.name}</h3>
        <p className="study-tagline">{s.tagline}</p>

        <div className="study-blocks">
          <div className="blk">
            <span className="mono">Problem</span>
            <p>{s.problem}</p>
          </div>
          <div className="blk">
            <span className="mono">Approach</span>
            <p>{s.approach}</p>
          </div>
          <div className="blk">
            <span className="mono">Outcome</span>
            <p>{s.outcome}</p>
          </div>
        </div>

        <div className="tags">
          {s.tags.map((t) => (
            <span className="tag" key={t}>
              {t}
            </span>
          ))}
        </div>

        <div className="study-links">
          <a className="link-arrow" href={s.url} target="_blank" rel="noopener noreferrer">
            Open live demo <IconArrow />
          </a>
        </div>
      </div>

      <a
        className="study-visual"
        href={s.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open ${s.name} live demo`}
      >
        <div className="frame-bar" aria-hidden="true">
          <i />
          <i />
          <i />
          <span className="url">{s.urlLabel}</span>
        </div>
        <Visual />
      </a>
    </Reveal>
  )
}

export default function CaseStudies() {
  return (
    <section id="work" aria-labelledby="work-title">
      <div className="container">
        <SectionHead
          num="02"
          title="Selected Work"
          note="Side projects, treated like products"
          id="work-title"
        />
        {studies.map((s, i) => (
          <Study key={s.id} s={s} flip={i % 2 === 1} />
        ))}
      </div>
    </section>
  )
}
