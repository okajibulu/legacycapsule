import { createClient } from '@supabase/supabase-js'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface AuditEntry {
  module: string
  action: string
  recordId?: string
  prev?: object | null
  next?: object | null
  reason?: string
}

export async function writeAuditLog(entry: AuditEntry) {
  await adminClient.from('admin_audit_log').insert({
    module: entry.module,
    action: entry.action,
    record_id: entry.recordId ?? null,
    prev_state: entry.prev ?? null,
    next_state: entry.next ?? null,
    reason: entry.reason ?? null,
  })
}