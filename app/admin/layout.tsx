import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import AdminShell from './AdminShell'

export const metadata = { title: 'LCAdmin · LegacyCapsule', robots: 'noindex, nofollow' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Login page is always accessible
  // All other /admin/* pages require auth
  return <AdminShell>{children}</AdminShell>
}
/* ========================================================= */