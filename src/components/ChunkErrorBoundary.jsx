import { Component } from 'react'

/**
 * Catches a failed lazy chunk import (e.g. a stale hashed filename 404s after
 * a deploy) so it doesn't unmount the whole app to a white page. Renders
 * nothing while failed and reports once via onError, so the caller can route
 * the reader back to a working view.
 */
export default class ChunkErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onError?.()
  }

  render() {
    if (this.state.failed) return null
    return this.props.children
  }
}
