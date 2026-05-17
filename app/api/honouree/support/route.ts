/**
 * ============================================================
 * LEGACYCAPSULE — app/api/honouree/support/route.ts
 * VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 * GET  — fetch all support accounts for a capsule
 * POST — create a support account
 * PUT  — update a support account (body includes id)
 * DELETE — soft-delete a support account (body includes id)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient }              from '@supabase/supabase-js';

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest): Promise<NextResponse> {
  const capsule_id = req.nextUrl.searchParams.get('capsule_id');
  if (!capsule_id) return NextResponse.json({ error: 'capsule_id required.' }, { status: 400 });

  const { data, error } = await adminClient
    .from('capsule_support_accounts')
    .select('id, method_label, account_holder, bank_name, account_number, reference_guide, currency, is_active, sort_order')
    .eq('capsule_id', capsule_id)
    .is('deleted_at', null)
    .order('sort_order');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ accounts: data ?? [] });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }); }

  const { capsule_id, method_label, account_holder, bank_name,
          account_number, reference_guide, currency, sort_order } = body as Record<string, string>;

  if (!capsule_id || !method_label || !account_holder) {
    return NextResponse.json({ error: 'capsule_id, method_label, account_holder required.' }, { status: 400 });
  }

  const { data, error } = await adminClient
    .from('capsule_support_accounts')
    .insert({ capsule_id, method_label, account_holder, bank_name, account_number,
              reference_guide, currency: currency ?? 'GBP', sort_order: Number(sort_order) || 0 })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }); }

  const { id, ...updates } = body as Record<string, unknown>;
  if (!id) return NextResponse.json({ error: 'id required.' }, { status: 400 });

  const { error } = await adminClient
    .from('capsule_support_accounts')
    .update(updates)
    .eq('id', id as string);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  let body: { id: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }); }

  if (!body.id) return NextResponse.json({ error: 'id required.' }, { status: 400 });

  const { error } = await adminClient
    .from('capsule_support_accounts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', body.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
