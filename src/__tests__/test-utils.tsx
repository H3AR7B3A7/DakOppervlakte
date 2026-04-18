import {
  type RenderHookOptions,
  type RenderOptions,
  render,
  renderHook,
} from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import type { ReactElement, ReactNode } from 'react'
import messages from '../../messages/nl.json'

const AllTheProviders = ({ children }: { children: ReactNode }) => {
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
