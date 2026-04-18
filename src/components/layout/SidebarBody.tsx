import type { ReactNode } from 'react'

interface SidebarBodyProps {
  children: ReactNode
}

export function SidebarBody({ children }: SidebarBodyProps) {
  return <div className="thin-scrollbar sidebar-body">{children}</div>
}
