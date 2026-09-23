import { Component } from 'react'

/**
 * Catches anything the 3D world throws — a failed chunk load, a shader
 * compile error, context creation — and hands the voyage back to the 2D
 * starfield instead of blanking the page.
 */
export default class WebGLBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onFail?.()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}
