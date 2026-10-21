-- FILE PATH: supabase/migrations/20261021000000_capsule_validity_from_first_approval.sql
-- DOCUMENT OWNER: LegacyCapsule Engineering
-- STATUS: Proposed — review required; not applied to production
-- VERSION: v1.0
-- CREATED: 21 October 2026
-- LAST UPDATED: 21 October 2026
-- DEPENDS ON: public.capsules, public.contributions
-- SUPERSEDES: None
-- SUPERSEDED BY: None
-- PURPOSE: Start capsule validity only when the first tribute or story is approved.
--
-- SECTION 1 — Canonical expiry field
-- valid_until replaces application references to the nonexistent expires_at column.
alter table public.capsules
  add column if not exists valid_until timestamptz;

comment on column public.capsules.valid_until is
  'Canonical validity end timestamp. Set when the first tribute or story is approved; extensions apply to this timestamp.';

-- SECTION 2 — Approval-triggered validity commencement
-- Free capsules default to 90 days. Paid capsules use validity_months, falling
-- back to six months for legacy paid rows without a configured duration.
-- A guarded update makes the start event idempotent: subsequent approvals do
-- not reset valid_until.
create or replace function public.lc_start_validity_on_first_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_months integer;
begin
  if new.status = 'approved'
     and old.status is distinct from 'approved'
     and new.deleted_at is null then

    update public.capsules c
       set valid_until = case
             when coalesce(c.validity_months, 0) > 0
               then now() + make_interval(months => c.validity_months)
             when coalesce(c.contribution_tier, 'free') = 'free'
               then now() + interval '90 days'
             else now() + interval '6 months'
           end,
           activated_at = coalesce(c.activated_at, now()),
           page_state = case
             when c.page_state in ('pending_verification', 'pending_payment')
               then 'active'
             else c.page_state
           end
     where c.id = new.capsule_id
       and c.valid_until is null
       and c.deleted_at is null
       -- A pending-payment capsule must not be activated or begin validity
       -- merely because a contribution was moderated unexpectedly.
       and c.page_state <> 'pending_payment';

  end if;

  return new;
end;
$$;

drop trigger if exists lc_first_approved_contribution_starts_validity
  on public.contributions;

create trigger lc_first_approved_contribution_starts_validity
after update of status on public.contributions
for each row
when (new.status = 'approved' and old.status is distinct from 'approved')
execute function public.lc_start_validity_on_first_approval();

-- SECTION 3 — Documented operational note
-- This migration is a proposed repository change only. Do not apply to production
-- until reviewed alongside legacy expiry data and existing activation behaviour.
