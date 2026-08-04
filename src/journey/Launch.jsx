import { m, useTransform } from 'framer-motion'
import { useScene } from './hooks'
import { identity } from '../data/content'
import { IconDownload } from '../components/Reveal'

const CHIPS = ['React', 'Redux', 'TypeScript', 'MSAL / Azure AD', 'EMV 3DS', 'Accessibility']

/** Scene 1 — LAUNCH. Silence, stars, a name — and the facts up front. */
export default function Launch({ onSkip }) {
  const { ref, p, height } = useScene(150)

  const titleY = useTransform(p, [0, 1], [0, -180])
  const titleO = useTransform(p, [0.14, 0.85], [1, 0])
  const cueO = useTransform(p, [0, 0.12], [1, 0])

  return (
    <section ref={ref} id="launch" className="scn" style={{ height }}>
      <div className="scn-stage launch-stage">
        <m.div className="launch-copy" style={{ y: titleY, opacity: titleO }}>
          <p className="kicker">Mission log · Day 2,372 · Deep field</p>
          <h1 className="launch-name">
            {identity.name.split(' ')[0]} {identity.name.split(' ')[1]}
            <span className="dot">.</span>
          </h1>
          <p className="launch-sub">
            Senior Frontend Engineer — six and a half years out, four worlds
            visited, homeward bound.
          </p>
          <p className="mono launch-clients">
            UnitedHealth Group · Albertsons · Fiserv · Estée Lauder
          </p>
          <div className="launch-glance">
            <div className="launch-chips" aria-label="Core skills">
              {CHIPS.map((c) => (
                <span key={c} className="tag">
                  {c}
                </span>
              ))}
            </div>
            <div className="launch-ctas">
              <a className="btn btn-primary" href={identity.resume} download>
                <IconDownload /> Download résumé
              </a>
              <button className="btn btn-ghost" onClick={onSkip} type="button">
                Résumé view →
              </button>
            </div>
          </div>
        </m.div>

        <m.div className="scroll-cue" style={{ opacity: cueO }} aria-hidden="true">
          <span className="mono">Scroll to begin the voyage</span>
          <span className="cue-line" />
        </m.div>
      </div>
    </section>
  )
}
