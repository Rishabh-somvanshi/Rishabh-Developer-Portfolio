// Vitest global setup.
// jsdom's localStorage is a proxy backed by a null-prototype object with no
// setItem/getItem/etc., so we replace window.localStorage with a faithful
// Storage-like polyfill for the duration of the test run.
import { afterEach } from 'vitest'

// jsdom has no ResizeObserver at all (unlike IntersectionObserver, which
// individual test files already stub where they need it — see
// useScene.test.jsx and App.test.jsx). Lenis's Dimensions class
// (node_modules/lenis) constructs one unconditionally, so any test that
// mounts the voyage (Journey.jsx initialises Lenis in an effect) throws
// "ResizeObserver is not defined" without this. A minimal no-op stub is
// enough — no test asserts on resize behaviour.
if (typeof window !== 'undefined' && typeof window.ResizeObserver === 'undefined') {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

if (typeof window !== 'undefined') {
  // Object.create(null) avoids prototype-pollution collisions (e.g. keys
  // named "__proto__" or "toString" would otherwise resolve against
  // Object.prototype instead of being stored as real entries).
  let storageData = Object.create(null)

  const localStorage = {
    getItem(key) {
      // Explicit presence check: an empty string is a valid stored value
      // and must round-trip as '', not be conflated with "never stored".
      return Object.prototype.hasOwnProperty.call(storageData, key) ? storageData[key] : null
    },
    setItem(key, value) {
      storageData[key] = String(value)
    },
    removeItem(key) {
      delete storageData[key]
    },
    clear() {
      storageData = Object.create(null)
    },
    key(index) {
      const keys = Object.keys(storageData)
      return keys[index] || null
    },
    get length() {
      return Object.keys(storageData).length
    },
  }

  // Replace window.localStorage with our functional implementation. Always
  // go through defineProperty (rather than plain assignment) so the
  // installed descriptor is deterministically configurable: true — a later
  // task redefines window.localStorage with a throwing getter and then
  // restores this captured descriptor, which requires configurable: true.
  Object.defineProperty(window, 'localStorage', {
    value: localStorage,
    writable: true,
    configurable: true,
  })

  // Reset storage between tests so state never leaks across test cases or
  // test files, which would otherwise cause order-dependent flakiness.
  afterEach(() => {
    storageData = Object.create(null)
  })
}
