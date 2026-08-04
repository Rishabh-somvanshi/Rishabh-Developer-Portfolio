// Setup file for test environment
// jsdom's localStorage is a proxy with a null-prototype object, so we need to recreate it
if (typeof window !== 'undefined') {
  // Create a proper Storage-like object
  const storageData = {}

  const localStorage = {
    getItem(key) {
      return storageData[key] || null
    },
    setItem(key, value) {
      storageData[key] = String(value)
    },
    removeItem(key) {
      delete storageData[key]
    },
    clear() {
      for (const key in storageData) {
        delete storageData[key]
      }
    },
    key(index) {
      const keys = Object.keys(storageData)
      return keys[index] || null
    },
    get length() {
      return Object.keys(storageData).length
    },
  }

  // Replace window.localStorage with our functional implementation
  try {
    window.localStorage = localStorage
  } catch (e) {
    // If we can't assign directly, try to proxy it or use Object.defineProperty
    Object.defineProperty(window, 'localStorage', {
      value: localStorage,
      writable: true,
      configurable: true,
    })
  }
}
