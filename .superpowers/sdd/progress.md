# Progress ledger — 2026-08-04-portfolio-perf-and-ux

Branch: feat/perf-and-ux
Base: ac3ed7d

Task 1: complete (commits a2da5e8..4baa3e6, review clean — vitest+jsdom, localStorage shim at vitest.setup.js)
Task 2: complete (commit a1db38b, review clean — src/lib/viewMode.js, 13 tests)
  Minor (defer to final review): viewMode.test.js lacks non-string `stored` / undefined `hash` cases; impl already handles them correctly.
Task 3: complete (commit 95fc6f8, review clean — App.jsx defaults to dossier, persists, #voyage deep link)
  Minor (STRONG candidate for final fix wave): no regression test for the deep-link scrollIntoView effect. Reviewer notes a jsdom spy test IS feasible (mock Element.prototype.scrollIntoView, set hash, flush rAF) — browser compositing is unavailable in this session, so this is the only way to pin it. Protects deep links already pasted into job applications.
Task 4: complete (commit e9a364c, review clean — .hero-voyage button in dossier hero)
  Minor: .mono adds uppercase+weight500 not accounted for in the rule (matches Nav idiom, likely fine — needs a human visual call).
  Minor: .hero-voyage redundantly re-declares font-family/font-size already in .mono.
  Minor: focus indicator is compliant ONLY via the global :focus-visible outline rule (global.css:112). The bespoke colour-only rule would fail SC 1.4.11 alone. Worth a code comment so a refactor cannot silently strip it.
Task 5: complete (commits 534761a, ff3672c, 1dd5bdf, d43a2f9 — review clean after fidelity fix)
  Removed ALL blur/backdrop-filter from src/. Also caught beyond the brief: scroll-driven blur in Reentry.jsx (inline style, invisible to CSS guard) and .nav.scrolled backdrop-filter in the DOSSIER nav.
  Guards now cover journey.css, global.css, and .jsx inline/hook blur — all three verified to fail against injected violations.
  Minor (final review): guard matches `animation:` shorthand only, would miss longhand animation-name/-duration.
  Minor (final review): JSX guard misses blur via CSS custom property or style.filter assignment in useEffect.
  HUMAN VISUAL CHECK NEEDED: .pulsar-beam feather width (3deg) and .bh-lens 2px@0.13 compensation are judgment calls.
Task 6: complete (commit 8473df9, review clean — observeInView + parking in useScene/usePin, .scn-parked CSS)
  All six scenes covered via the shared hook (verified by reading each component, not the report).
  Minor (final review): no test asserts useScene/usePin actually call useParkWhenOffScreen — dropping that call would pass the suite.
