import '@testing-library/jest-dom'
import './src/__tests__/__mocks__/googleMaps'

// jsdom does not implement PointerEvent; provide a minimal polyfill so tests
// that dispatch synthetic pointer events (e.g. long-press) can run.
if (typeof window !== 'undefined' && typeof window.PointerEvent === 'undefined') {
  class PointerEventPolyfill extends MouseEvent {
    public readonly pointerId: number
    public readonly pointerType: string
    constructor(type: string, props: PointerEventInit = {}) {
      super(type, props)
      this.pointerId = props.pointerId ?? 0
      this.pointerType = props.pointerType ?? ''
    }
  }
  // @ts-expect-error polyfill assignment
  window.PointerEvent = PointerEventPolyfill
  // @ts-expect-error polyfill assignment
  globalThis.PointerEvent = PointerEventPolyfill
}

// @testing-library/dom's `waitFor` only detects fake timers when `jest` is a
// defined global (see jestFakeTimersAreEnabled in helpers.js). Vitest does not
// expose a `jest` global, so tests that call `vi.useFakeTimers()` and then
// rely on `findBy*` / `waitFor` hang forever. Provide a minimal shim so
// testing-library notices the fake timers and uses the sync detection path.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).jest = {
  advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms),
}
