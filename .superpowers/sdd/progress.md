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
Task 7: complete (commit 6159ffc, review clean — useSpring damping via useGlide; parking preserved)
  Spring is overdamped (ratio ~1.62), settles without oscillation. GLIDE feel unverified — needs human scroll test.
  Minor (final review): useSpring is created+subscribed even for reduced-motion users, doing discarded per-frame work for the people who asked for less. Rules of Hooks forces the unconditional call; worth a comment.
Task 8: complete (commits fc1b2cb, 128ae31 — grain/vignette/Gargantua arc; blend mode dropped for perf)
  bh-arc placed after bh-core (deviates from brief) — correct: core radius ~88px > arc semi-minor 58px, so arc peak would be hidden otherwise.
  Grain now plain opacity on ::after (0.22), vignette full strength on element. Restore switch documented in CSS comment.
  HUMAN CHECK: grain may now read too faint; one-line switch documented in journey.css above .voyage-atmosphere.
  Minor: report overstated that the brief authorised the DOM-order deviation (it did not; the deviation was still right).
Task 9: complete (commit 5412757, review clean — wildcard animation:none replaces hand-listed selectors)
  JS-driven motion handled elsewhere: Starfield still={reduced}, and MotionConfig reducedMotion="user" in App.jsx.
Task 10: complete (commits 8b199b8, b3aa268, review clean — mobile tier)
  Fixed post-review: .pulsar-beam no longer hidden on phones (my tier was written when it was still blurred; blur is gone, so it is compositor-only and cheap). Cascade collision fixed so reduced-motion opacity wins on phones.
Task 11: complete (commit 5d0f862 — scripts/audit.js, scripts/audit-static.mjs, npm run audit, docs/VERIFICATION.md)
Final whole-branch review (opus): no shipped-behaviour defect found; verdict "ready to merge after fixes".
Final fixes applied (commits 6aa07cd..f241724): jsx test discovery, scene-parking test, deep-link scrollIntoView test, longhand-animation guard, rootMargin assertion, usePin deleted, dead .hero-voyage declarations, .bh-arc now scales with parent, corrected .scn-parked comment, querySelector try/catch, dossier checks in VERIFICATION.md, plan marked executed.
FINAL STATE: 33 tests / 7 files pass, build clean, npm run audit PASS (0 blur, 0 backdrop-filter, meta parity 13 tags), tree clean, 39 commits on branch.

MERGED to main (f4711c2) and DEPLOYED to Netlify production 2026-08-04.
  Deploy id 6a71be51c98ec3788c6f8a82 (build id ...a80). Site converted from drag-and-drop to a real Netlify build (netlify.toml: npm run build -> dist).
  Rollback target if ever needed: previous live deploy 6a579a0ae8a9feae7900273f (permalink stays up permanently).
  LIVE VERIFIED: bundle byte-identical to local build (sha d70b1d1f...); / -> dossier (0 infinite anims, 0 blur, 0 backdrop-filter); /#voyage -> voyage, 10 scenes, atmosphere + bh-arc, 0 blur, 0 blurred-and-animated, 0 backdrop-filter; /#experience -> dossier with all 5 anchors; 13 meta tags intact; resume/og/favicon all 200.
  NOT verifiable in this environment: frame timing, runtime scene parking (IntersectionObserver never fires without compositing), and every visual judgement. See docs/VERIFICATION.md.
