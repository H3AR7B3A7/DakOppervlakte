import '@testing-library/jest-dom'
import './src/__tests__/__mocks__/googleMaps'

// jsdom does not implement matchMedia; provide a desktop-default stub so
// components using `useIsMobile` can mount without throwing. Tests that need
// mobile can override this per-suite.
if (typeof window !== 'undefined' && typeof window.matchMedia === 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: query.includes('min-width: 768px'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  })
}

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

