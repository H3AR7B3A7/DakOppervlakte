import '@testing-library/jest-dom'
import './src/__tests__/__mocks__/googleMaps'

// jsdom does not implement matchMedia; provide a desktop-default stub so
// components using `useIsMobile` can mount without throwing. Tests that need
// mobile can override this per-suite. The desktop default is re-installed
// after every test so a mobile override does not leak across files/workers.
function createMatchMedia(isMobile: boolean) {
  return (query: string) => ({
    matches: query.includes('min-width: 768px') ? !isMobile : false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    value: createMatchMedia(false),
    writable: true,
    configurable: true,
  })
}

afterEach(() => {
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'matchMedia', {
      value: createMatchMedia(false),
      writable: true,
      configurable: true,
    })
  }
})

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
