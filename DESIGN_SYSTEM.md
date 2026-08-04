# Design System — rishabh-somvanshi-developer

Single source of truth for visual decisions. Every component uses these tokens
(CSS custom properties in `src/styles/global.css`). No one-off hex values, no
ad-hoc font sizes, no off-grid spacing.

## Color tokens

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0a0a0b` | Page background (near-black, neutral) |
| `--surface` | `#111113` | Cards, nav (scrolled), preview frames |
| `--surface-2` | `#18181b` | Nested surfaces, hover fills |
| `--border` | `rgba(255,255,255,.08)` | Hairlines, card borders |
| `--border-strong` | `rgba(255,255,255,.16)` | Hovered borders, emphasis rules |
| `--text` | `#ededef` | Headings, primary text (never pure white) |
| `--text-2` | `#a7a7ae` | Body copy, bullets |
| `--text-3` | `#82828b` | Metadata, mono labels (AA on `--bg`) |
| `--accent` | `#e8942a` | THE accent. Labels, markers, key links, primary CTA |
| `--accent-bright` | `#f5a93d` | Accent hover state only |
| `--accent-dim` | `rgba(232,148,42,.13)` | Accent-tinted fills (chips, glows) |

Rule: one accent, used deliberately — section numbers, timeline markers, the
brand period, primary CTA, link hovers. If everything is amber, nothing is.

## Typography

| Role | Font | Token |
|---|---|---|
| Display (name, H2, big statements) | Space Grotesk Variable | `--font-display` |
| Body | Inter Variable | `--font-body` |
| Meta (dates, tags, labels, nav) | JetBrains Mono Variable | `--font-mono` |

Scale (rem):

| Token | Size | Use |
|---|---|---|
| `--fs-xs` | 0.75 | Mono labels, tags, footer meta |
| `--fs-sm` | 0.875 | Secondary text, nav links, dates |
| `--fs-base` | 1 | Body copy (line-height 1.65) |
| `--fs-lg` | 1.1875 | Lead paragraphs, role titles |
| `--fs-xl` | 1.5 | Case-study titles, contact sub |
| `--fs-h2` | clamp(2.125rem → 3rem) | Section headers |
| `--fs-hero` | clamp(2.875rem → 5.5rem) | Hero name |

Mono labels are always: uppercase, `letter-spacing: .12em`, `--fs-xs`.

## Spacing — 8px grid

`--s1`=8 `--s2`=16 `--s3`=24 `--s4`=32 `--s6`=48 `--s8`=64 `--s12`=96 `--s16`=128 (px, set in rem).
Section rhythm: `clamp(96px → 160px)` block padding. Content column: 1088px max.

## Motion (Framer Motion only)

- Scroll-triggered fade-ups: 20px rise, 0.55s, `[0.21, 0.47, 0.32, 0.98]` ease, trigger once at `-80px` viewport margin.
- Staggers: 70–90ms between siblings (timeline entries, skill groups, chips).
- Timeline rail: scroll-linked `scaleY` via `useScroll` + `useSpring`.
- Hovers: CSS, 160–200ms ease — border-color + 2–3px lift. No bounce, no spring wobble.
- `MotionConfig reducedMotion="user"` honors `prefers-reduced-motion` globally.

## Voice

Precise, confident, understated. No theme language, no emoji-as-icons, no
exclamation marks. Every claim traceable to the resume.
