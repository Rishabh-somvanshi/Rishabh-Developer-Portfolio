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
