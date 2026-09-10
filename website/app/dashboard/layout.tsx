import { requireAuth } from '@/lib/auth/guards'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth()   // redirects to /login if unauthenticated
  return <DashboardLayout user={user}>{children}</DashboardLayout>
}
