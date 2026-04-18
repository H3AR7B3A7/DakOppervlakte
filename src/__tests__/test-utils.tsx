import {
  type RenderHookOptions,
  type RenderOptions,
  render,
  renderHook,
} from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import type React from 'react'
import type { ReactElement } from 'react'
import messages from '../../messages/nl.json'

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <NextIntlClientProvider locale="nl" messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options })

export function renderHookWithIntl<Result, Props>(
  hook: (props: Props) => Result,
  options?: Omit<RenderHookOptions<Props>, 'wrapper'>,
) {
  return renderHook(hook, { wrapper: AllTheProviders, ...options })
}

export * from '@testing-library/react'
export { customRender as render }
