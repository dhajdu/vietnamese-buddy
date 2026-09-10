export interface NavItem {
  label: string
  href: string
  icon?: string   // Lucide icon name as string — TODO: replace with actual import
  children?: NavItem[]
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Settings', href: '/dashboard/settings', icon: 'Settings' },
  // TODO: add your project's nav items here
]
