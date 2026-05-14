import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import AdminShell from '@/components/admin/AdminShell'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!isAdminAuthenticated()) {
    redirect('/admin/login')
  }

  return <AdminShell>{children}</AdminShell>
}