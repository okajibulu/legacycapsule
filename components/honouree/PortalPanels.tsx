'use client';

/**
 * ============================================================
 * LEGACYCAPSULE — components/honouree/TributesPanel.tsx
 * VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 * Read-only view of all approved tributes for the honouree.
 * Same premium card design as the public wall.
 * Private — no public indicator that the honouree is reading.
 */

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Panel header helper ───────────────────────────────────────

function PanelHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <p className="text-[9px] text-yellow-400/40 uppercase tracking-[0.2em] mb-1">
        Personal Portal
      </p>
      <h2 className="text-xl font-bold text-white leading-tight mb-1"
        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
        {title}
      </h2>
      {subtitle && (
        <p className="text-white/40 text-sm">{subtitle}</p>
      )}
    </div>
  );
}

// ── TributesPanel ─────────────────────────────────────────────

export function TributesPanel({
  capsuleId,
  honoureeName,
}: {
  capsuleId:    string;
  honoureeName: string;
}) {
  const [tributes, setTributes]   = useState<any[]>([]);
  const [loading,  setLoading]    = useState(true);
  const [expanded, setExpanded]   = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase
      .from('contributions')
      .select('id, contributor_name, city, country, relationship, tribute_text, is_anonymous, created_at')
      .eq('capsule_id', capsuleId)
      .eq('status', 'approved')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setTributes(data ?? []);
        setLoading(false);
      });
  }, [capsuleId]);

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div>
      <PanelHeader
        title="Tributes"
        subtitle={`${tributes.length} tribute${tributes.length !== 1 ? 's' : ''} received from around the world`}
      />

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-5 animate-pulse">
              <div className="h-3 bg-white/10 rounded w-1/3 mb-3" />
              <div className="h-3 bg-white/10 rounded w-full mb-2" />
              <div className="h-3 bg-white/10 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {!loading && tributes.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-10 text-center">
          <p className="text-white/40 text-sm">No tributes yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {tributes.map(t => {
          const isExp    = expanded.has(t.id);
          const text     = t.tribute_text ?? '';
          const preview  = text.slice(0, 180);
          const hasMore  = text.length > 180;
          const location = [t.city, t.country].filter(Boolean).join(', ');

          return (
            <div
              key={t.id}
              className="
                rounded-xl border border-white/10 bg-white/[0.02]
                p-5 transition-all hover:border-yellow-400/15
              "
            >
              {/* Gold top rule */}
              <div className="h-[2px] bg-gradient-to-r from-[#B8960C]/60 to-transparent mb-4 -mx-5 -mt-5 rounded-t-xl" />

              <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                <div>
                  <p className="font-semibold text-white/80 text-sm">
                    {t.is_anonymous ? 'Anonymous' : t.contributor_name}
                  </p>
                  {location && (
                    <p className="text-[11px] text-white/35 mt-0.5">{location}</p>
                  )}
                </div>
                {t.relationship && (
                  <p className="text-[11px] text-yellow-400/50 italic flex-shrink-0">
                    {t.relationship}
                  </p>
                )}
              </div>

              <p className="text-white/60 text-sm leading-relaxed">
                {isExp ? text : preview}{hasMore && !isExp ? '…' : ''}
              </p>

              {hasMore && (
                <button
                  onClick={() => toggleExpand(t.id)}
                  className="text-[11px] text-yellow-400/50 hover:text-yellow-400 mt-2 transition-colors"
                >
                  {isExp ? 'Show less' : 'Read more'}
                </button>
              )}

              <p className="text-[10px] text-white/20 mt-3">
                {new Date(t.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ── WaysToHonourPanel ──────────────────────────────────────────

export function WaysToHonourPanel({
  capsuleId,
  eventType,
  honoureeName,
  slug,
}: {
  capsuleId:    string;
  eventType:    string;
  honoureeName: string;
  slug:         string;
}) {
  const [accounts, setAccounts]         = useState<any[]>([]);
  const [acks,     setAcks]             = useState<any[]>([]);
  const [loading,  setLoading]          = useState(true);
  const [showForm, setShowForm]         = useState(false);
  const [saving,   setSaving]           = useState(false);
  const [form,     setForm]             = useState({
    method_label: '', account_holder: '', bank_name: '',
    account_number: '', reference_guide: '', currency: 'GBP',
  });

  const fetchData = useCallback(async () => {
    const [accsRes, acksRes] = await Promise.all([
      fetch(`/api/honouree/support?capsule_id=${capsuleId}`).then(r => r.json()),
      supabase.from('support_acknowledgements')
        .select('id, supporter_name, created_at')
        .eq('capsule_id', capsuleId)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);
    setAccounts(accsRes.accounts ?? []);
    setAcks(acksRes.data ?? []);
    setLoading(false);
  }, [capsuleId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (!form.method_label || !form.account_holder) return;
    setSaving(true);
    await fetch('/api/honouree/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capsule_id: capsuleId, ...form }),
    });
    setSaving(false);
    setShowForm(false);
    setForm({ method_label: '', account_holder: '', bank_name: '', account_number: '', reference_guide: '', currency: 'GBP' });
    fetchData();
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    await fetch('/api/honouree/support', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !current }),
    });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this payment method?')) return;
    await fetch('/api/honouree/support', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchData();
  };

  const inputClass = `
    w-full px-3 py-2.5 rounded-lg text-sm
    bg-white/5 border border-white/15 text-white
    placeholder:text-white/25
    focus:outline-none focus:border-yellow-400/40
  `;

  return (
    <div>
      <PanelHeader
        title="Ways to Honour"
        subtitle="Manage your gifting details shown on the public profile page"
      />

      {/* Payment methods */}
      <div className="space-y-3 mb-6">
        {loading ? (
          <div className="h-20 rounded-xl bg-white/[0.03] animate-pulse" />
        ) : accounts.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center">
            <p className="text-white/40 text-sm">No payment methods added yet.</p>
          </div>
        ) : (
          accounts.map(acc => (
            <div key={acc.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white/70">{acc.method_label}</p>
                  <p className="text-xs text-white/40">{acc.account_holder}</p>
                  {acc.bank_name && <p className="text-xs text-white/30">{acc.bank_name}</p>}
                  <p className="text-xs text-yellow-400/50 font-mono mt-1">
                    ••••{String(acc.account_number ?? '').slice(-4)} · {acc.currency}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggleActive(acc.id, acc.is_active)}
                    className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                      acc.is_active
                        ? 'border-green-400/30 text-green-300/70 bg-green-400/5'
                        : 'border-white/15 text-white/30'
                    }`}
                  >
                    {acc.is_active ? 'Shown' : 'Hidden'}
                  </button>
                  <button
                    onClick={() => handleDelete(acc.id)}
                    className="text-[10px] px-2 py-1 rounded border border-red-400/20 text-red-400/50 hover:text-red-400 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add method form */}
      {showForm ? (
        <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-4 space-y-3 mb-4">
          <p className="text-sm font-medium text-yellow-200 mb-2">Add payment method</p>
          {[
            { key: 'method_label',    placeholder: 'Payment method (e.g. Bank Transfer, Mobile Money)',  required: true },
            { key: 'account_holder',  placeholder: 'Account holder name',                                required: true },
            { key: 'bank_name',       placeholder: 'Bank or institution name',                           required: false },
            { key: 'account_number',  placeholder: 'Account number',                                    required: false },
            { key: 'reference_guide', placeholder: 'Reference guide (e.g. Use your name as reference)', required: false },
          ].map(f => (
            <input
              key={f.key}
              type="text"
              placeholder={f.placeholder}
              value={(form as any)[f.key]}
              onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
              className={inputClass}
            />
          ))}
          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2 rounded-lg text-sm font-bold bg-yellow-400 text-purple-950 hover:bg-yellow-300 transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg text-sm border border-white/10 text-white/40 hover:text-white/60 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)}
          className="w-full py-3 rounded-xl border border-white/15 text-white/50 text-sm hover:border-yellow-400/20 hover:text-white/70 transition-all mb-6">
          + Add payment method
        </button>
      )}

      {/* Gift acknowledgements */}
      {acks.length > 0 && (
        <div>
          <p className="text-[10px] text-yellow-400/50 uppercase tracking-wider mb-3">
            Gift acknowledgements ({acks.length})
          </p>
          <div className="space-y-2">
            {acks.map(ack => (
              <div key={ack.id} className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white/[0.02] border border-white/8">
                <span className="text-yellow-400 text-sm" aria-hidden="true">✓</span>
                <p className="text-sm text-white/60">{ack.supporter_name}</p>
                <p className="text-[10px] text-white/25 ml-auto">
                  {new Date(ack.created_at).toLocaleDateString('en-GB')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


// ── AppreciationPanel ─────────────────────────────────────────

export function AppreciationPanel({
  capsuleId,
  eventType,
  honoureeName,
}: {
  capsuleId:    string;
  eventType:    string;
  honoureeName: string;
}) {
  const [contributors, setContributors] = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [sending,      setSending]      = useState<string | null>(null); // contribution id
  const [sent,         setSent]         = useState<Set<string>>(new Set());
  const [preview,      setPreview]      = useState<string | null>(null);
  const [collective,   setCollective]   = useState(false);
  const [collSending,  setCollSending]  = useState(false);
  const [collResult,   setCollResult]   = useState<{ sent: number; failed: number } | null>(null);

  useEffect(() => {
    supabase
      .from('contributions')
      .select('id, contributor_name, city, country, tribute_text, email, is_anonymous, created_at')
      .eq('capsule_id', capsuleId)
      .eq('status', 'approved')
      .is('deleted_at', null)
      .order('created_at')
      .then(({ data }) => {
        setContributors(data ?? []);
        setLoading(false);
      });
  }, [capsuleId]);

  // Check correspondence log for already-sent appreciations
  useEffect(() => {
    if (contributors.length === 0) return;
    supabase
      .from('correspondence_log')
      .select('contribution_id')
      .eq('capsule_id', capsuleId)
      .eq('message_type', 'individual_appreciation')
      .eq('status', 'sent')
      .then(({ data }) => {
        const ids = new Set((data ?? []).map((r: any) => r.contribution_id).filter(Boolean));
        setSent(ids);
      });
  }, [capsuleId, contributors]);

  const sendIndividual = async (contributionId: string) => {
    setSending(contributionId);
    const res = await fetch('/api/email/appreciation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capsule_id: capsuleId, mode: 'individual', contribution_id: contributionId }),
    });
    setSending(null);
    if (res.ok) {
      setSent(prev => new Set([...prev, contributionId]));
    }
  };

  const sendCollective = async () => {
    setCollSending(true);
    const res = await fetch('/api/email/appreciation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capsule_id: capsuleId, mode: 'collective' }),
    });
    const data = await res.json();
    setCollSending(false);
    setCollResult({ sent: data.sent ?? 0, failed: data.failed ?? 0 });
  };

  const reachable   = contributors.filter(c => c.email && !c.is_anonymous);
  const anonymous   = contributors.filter(c => !c.email || c.is_anonymous);

  return (
    <div>
      <PanelHeader
        title="Appreciation Dispatch"
        subtitle={`${reachable.length} contributors can receive an email · ${anonymous.length} left anonymous tributes`}
      />

      {/* Collective send option */}
      <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-4 mb-6">
        <p className="text-sm font-medium text-yellow-200 mb-1">
          Collective appreciation
        </p>
        <p className="text-[11px] text-white/40 mb-3 leading-relaxed">
          Send one beautiful message to all {reachable.length} reachable contributors
          at once — referencing the collective scale of the response.
        </p>
        {collResult ? (
          <p className="text-xs text-green-300/80">
            ✓ Sent to {collResult.sent} contributor{collResult.sent !== 1 ? 's' : ''}.
            {collResult.failed > 0 && ` ${collResult.failed} failed — check correspondence log.`}
          </p>
        ) : (
          <button
            onClick={() => setCollective(true)}
            className="text-xs px-4 py-2 rounded-lg bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 hover:bg-yellow-400/20 transition-colors"
          >
            Send collective appreciation — preview before send
          </button>
        )}
        {collective && !collResult && (
          <div className="mt-3 p-3 rounded-lg bg-black/20 border border-white/10">
            <p className="text-xs text-white/60 mb-3 leading-relaxed">
              This will send a personalised email to each of the {reachable.length} contributors
              who left their email. The message will reference the full collective of {contributors.length} tributes.
              Preview your template in the Email Template section before sending.
            </p>
            <div className="flex gap-2">
              <button
                onClick={sendCollective}
                disabled={collSending}
                className="text-xs px-4 py-2 rounded-lg bg-yellow-400 text-purple-950 font-bold hover:bg-yellow-300 transition-colors disabled:opacity-50"
              >
                {collSending ? `Sending…` : 'Confirm send'}
              </button>
              <button
                onClick={() => setCollective(false)}
                className="text-xs px-4 py-2 rounded-lg border border-white/10 text-white/40 hover:text-white/60 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Individual list */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-white/[0.03] animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {reachable.map(c => {
            const isSending = sending === c.id;
            const wasSent   = sent.has(c.id);
            const location  = [c.city, c.country].filter(Boolean).join(', ');
            const excerpt   = (c.tribute_text ?? '').slice(0, 80);

            return (
              <div
                key={c.id}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-start gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap mb-0.5">
                    <p className="text-sm font-medium text-white/70">{c.contributor_name}</p>
                    {location && <p className="text-[10px] text-white/30">{location}</p>}
                  </div>
                  {excerpt && (
                    <p className="text-[11px] text-white/35 truncate">{excerpt}…</p>
                  )}
                </div>
                {wasSent ? (
                  <span className="text-[10px] text-green-400/60 flex-shrink-0 mt-1">✓ Sent</span>
                ) : (
                  <button
                    onClick={() => !isSending && sendIndividual(c.id)}
                    disabled={isSending}
                    className="
                      flex-shrink-0 text-[10px] px-3 py-1.5 rounded-lg
                      bg-yellow-400/10 border border-yellow-400/20
                      text-yellow-300 hover:bg-yellow-400/20
                      transition-colors disabled:opacity-50
                    "
                  >
                    {isSending ? 'Sending…' : 'Send'}
                  </button>
                )}
              </div>
            );
          })}

          {/* Anonymous — no contact */}
          {anonymous.length > 0 && (
            <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4 mt-2">
              <p className="text-[11px] text-white/25">
                {anonymous.length} contributor{anonymous.length !== 1 ? 's' : ''} left
                anonymous tribute{anonymous.length !== 1 ? 's' : ''} — no contact details available.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// ── CorrespondenceLog ─────────────────────────────────────────

export function CorrespondenceLog({ capsuleId }: { capsuleId: string }) {
  const [logs,    setLogs]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<string>('all');

  useEffect(() => {
    let q = supabase
      .from('correspondence_log')
      .select('id, recipient_name, recipient_email, channel, message_type, status, sent_at')
      .eq('capsule_id', capsuleId)
      .order('sent_at', { ascending: false })
      .limit(100);

    if (filter !== 'all') q = q.eq('message_type', filter);

    q.then(({ data }) => { setLogs(data ?? []); setLoading(false); });
  }, [capsuleId, filter]);

  const STATUS_COLOUR: Record<string, string> = {
    sent:    'text-green-400/70',
    failed:  'text-red-400/60',
    bounced: 'text-yellow-400/60',
    pending: 'text-white/40',
  };

  const TYPE_LABEL: Record<string, string> = {
    individual_appreciation: 'Individual',
    collective:              'Collective',
    broadcast:               'Broadcast',
    anniversary:             'Anniversary',
    support_thankyou:        'Gift thank-you',
  };

  return (
    <div>
      <PanelHeader
        title="Correspondence Log"
        subtitle="All emails sent from this portal"
      />

      {/* Filter */}
      <div className="flex gap-2 flex-wrap mb-4">
        {['all', 'individual_appreciation', 'collective', 'broadcast', 'support_thankyou'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-[10px] px-3 py-1.5 rounded-full border transition-colors ${
              filter === f
                ? 'bg-yellow-400/10 border-yellow-400/20 text-yellow-300'
                : 'border-white/10 text-white/30 hover:text-white/50'
            }`}
          >
            {f === 'all' ? 'All' : TYPE_LABEL[f]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-12 rounded-lg bg-white/[0.03] animate-pulse" />)}
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center">
          <p className="text-white/30 text-sm">No correspondence yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs" aria-label="Correspondence log">
            <thead>
              <tr className="text-white/30 text-left border-b border-white/10">
                <th className="pb-2 pr-4 font-medium">Recipient</th>
                <th className="pb-2 pr-4 font-medium">Type</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-white/[0.02]">
                  <td className="py-2.5 pr-4 text-white/60">{log.recipient_name}</td>
                  <td className="py-2.5 pr-4 text-white/40">{TYPE_LABEL[log.message_type] ?? log.message_type}</td>
                  <td className={`py-2.5 pr-4 ${STATUS_COLOUR[log.status] ?? 'text-white/40'}`}>
                    {log.status}
                  </td>
                  <td className="py-2.5 text-white/25">
                    {log.sent_at ? new Date(log.sent_at).toLocaleDateString('en-GB') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


// ── BroadcastPanel ────────────────────────────────────────────

export function BroadcastPanel({
  capsuleId,
  honoureeName,
}: {
  capsuleId:    string;
  honoureeName: string;
}) {
  const [subject,  setSubject]  = useState('');
  const [body,     setBody]     = useState('');
  const [preview,  setPreview]  = useState(false);
  const [sending,  setSending]  = useState(false);
  const [result,   setResult]   = useState<{ sent: number; failed: number } | null>(null);
  const [error,    setError]    = useState<string | null>(null);

  const canSend = subject.trim().length > 0 && body.trim().length > 0;

  const handleSend = async () => {
    setSending(true); setError(null);
    const res = await fetch('/api/honouree/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capsule_id: capsuleId, subject, body }),
    });
    setSending(false);
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? 'Send failed.'); return; }
    setResult({ sent: data.sent, failed: data.failed });
  };

  const inputClass = `
    w-full px-3 py-2.5 rounded-lg text-sm
    bg-white/5 border border-white/15 text-white
    placeholder:text-white/25
    focus:outline-none focus:border-yellow-400/40
  `;

  return (
    <div>
      <PanelHeader
        title="Broadcast"
        subtitle="Send a single message to all contributors who left an email. Limit: one per 7 days."
      />

      {result ? (
        <div className="rounded-xl border border-green-400/20 bg-green-400/5 p-5 text-center">
          <p className="text-green-300 font-medium mb-1">Broadcast complete</p>
          <p className="text-sm text-white/50">
            Sent to {result.sent} contributor{result.sent !== 1 ? 's' : ''}.
            {result.failed > 0 && ` ${result.failed} failed — check correspondence log.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1.5">
              Subject line
            </label>
            <input
              type="text"
              placeholder="e.g. A message from [Name]"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1.5">
              Message
            </label>
            <textarea
              rows={8}
              placeholder="Write your message here…"
              value={body}
              onChange={e => setBody(e.target.value)}
              className={inputClass + ' resize-none leading-relaxed'}
            />
          </div>

          {/* Preview toggle */}
          {canSend && !preview && (
            <button
              onClick={() => setPreview(true)}
              className="w-full py-3 rounded-xl border border-white/15 text-white/50 text-sm hover:border-yellow-400/20 hover:text-white/70 transition-all"
            >
              Preview before sending
            </button>
          )}

          {preview && (
            <div className="rounded-xl border border-yellow-400/20 bg-[#F5F3EE] p-6">
              <p className="text-[10px] text-[#B8960C] uppercase tracking-wider mb-2 font-bold">
                Email preview
              </p>
              <p className="text-[#1C1C1E] text-sm font-bold mb-1">{subject}</p>
              <p className="text-[#5F5E5A] text-xs mb-3">
                From: {honoureeName} via LegacyCapsule &lt;noreply@itslegacycapsule.com&gt;
              </p>
              <p className="text-[#1C1C1E] text-sm leading-relaxed whitespace-pre-wrap">{body}</p>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400/70 rounded-lg border border-red-400/20 bg-red-500/5 px-4 py-3">
              {error}
            </p>
          )}

          {preview && (
            <div className="flex gap-3">
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-b from-yellow-400 to-yellow-500 text-purple-950 hover:from-yellow-300 transition-colors disabled:opacity-50"
              >
                {sending ? 'Sending…' : 'Send broadcast'}
              </button>
              <button
                onClick={() => setPreview(false)}
                className="px-5 py-3.5 rounded-xl border border-white/10 text-white/40 text-sm hover:text-white/60 transition-colors"
              >
                Edit
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// ── AnniversaryPanel ──────────────────────────────────────────

export function AnniversaryPanel({ capsuleId }: { capsuleId: string }) {
  const [note,    setNote]    = useState('');
  const [saved,   setSaved]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('honouree_email_templates')
      .select('anniversary_note')
      .eq('capsule_id', capsuleId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.anniversary_note) setNote(data.anniversary_note);
        setLoading(false);
      });
  }, [capsuleId]);

  const handleSave = async () => {
    setSaving(true);
    await supabase
      .from('honouree_email_templates')
      .upsert({
        capsule_id:       capsuleId,
        anniversary_note: note,
        updated_at:       new Date().toISOString(),
      }, { onConflict: 'capsule_id' });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <PanelHeader
        title="Anniversary Note"
        subtitle="Write a personal message to attach to the one-year anniversary email sent to all contributors."
      />

      <div className="rounded-xl border border-yellow-400/15 bg-yellow-400/5 p-4 mb-5">
        <p className="text-[11px] text-yellow-300/70 leading-relaxed">
          On the one-year anniversary of the event, LegacyCapsule sends a keepsake email
          to all opted-in contributors. Your note will be included — a personal word from
          you, one year on. Write it whenever you're ready. It's saved here until needed.
        </p>
      </div>

      {loading ? (
        <div className="h-40 rounded-xl bg-white/[0.03] animate-pulse" />
      ) : (
        <>
          <textarea
            rows={10}
            placeholder="Write your anniversary note here… It can be brief or long — whatever feels right."
            value={note}
            onChange={e => { setNote(e.target.value); setSaved(false); }}
            className="
              w-full px-4 py-3 rounded-xl text-sm
              bg-white/5 border border-white/15 text-white
              placeholder:text-white/25
              focus:outline-none focus:border-yellow-400/40
              resize-none leading-relaxed mb-4
            "
          />
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !note.trim()}
              className="px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-b from-yellow-400 to-yellow-500 text-purple-950 hover:from-yellow-300 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save note'}
            </button>
            {saved && (
              <p className="text-xs text-green-400/70">✓ Saved</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}


// ── ThankYouTemplatePanel ─────────────────────────────────────

export function ThankYouTemplatePanel({
  capsuleId,
  honoureeName,
}: {
  capsuleId:    string;
  honoureeName: string;
}) {
  const [type,    setType]    = useState<'default' | 'custom'>('default');
  const [body,    setBody]    = useState('');
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('honouree_email_templates')
      .select('template_type, custom_body')
      .eq('capsule_id', capsuleId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setType(data.template_type as 'default' | 'custom');
          setBody(data.custom_body ?? '');
        }
        setLoading(false);
      });
  }, [capsuleId]);

  const handleSave = async () => {
    setSaving(true);
    await supabase
      .from('honouree_email_templates')
      .upsert({
        capsule_id:    capsuleId,
        template_type: type,
        custom_body:   type === 'custom' ? body : null,
        updated_at:    new Date().toISOString(),
      }, { onConflict: 'capsule_id' });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const defaultPreview = `Dear [Contributor name],

Thank you for the words you sent. They reached me, and they meant more than I can say.

Knowing that you took the time to put your thoughts into words — and that those words are now preserved alongside so many others — is something I will carry with me.

With sincere gratitude,
${honoureeName}`;

  return (
    <div>
      <PanelHeader
        title="Email Template"
        subtitle="Choose how your appreciation emails are worded."
      />

      {/* Toggle */}
      <div className="flex gap-2 mb-5">
        {(['default', 'custom'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setType(t); setSaved(false); }}
            className={`
              flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors
              ${type === t
                ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-200'
                : 'border-white/10 text-white/40 hover:text-white/60'
              }
            `}
          >
            {t === 'default' ? 'LegacyCapsule default' : 'Custom message'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-40 rounded-xl bg-white/[0.03] animate-pulse" />
      ) : type === 'default' ? (
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-wider mb-3">Preview</p>
          <div className="rounded-xl border border-white/10 bg-[#F5F3EE] p-5">
            <p className="text-[#1C1C1E] text-sm leading-relaxed whitespace-pre-wrap font-serif">
              {defaultPreview}
            </p>
          </div>
          <p className="text-[11px] text-white/30 mt-3 leading-relaxed">
            The contributor's name, tribute excerpt, and LC footer are added automatically.
          </p>
        </div>
      ) : (
        <div>
          <p className="text-[11px] text-white/40 mb-3 leading-relaxed">
            Write your message below. LegacyCapsule branding and the contributor's name
            greeting will be added automatically.
          </p>
          <textarea
            rows={10}
            placeholder="Write your appreciation message here…"
            value={body}
            onChange={e => { setBody(e.target.value); setSaved(false); }}
            className="
              w-full px-4 py-3 rounded-xl text-sm
              bg-white/5 border border-white/15 text-white
              placeholder:text-white/25
              focus:outline-none focus:border-yellow-400/40
              resize-none leading-relaxed mb-4
            "
          />
        </div>
      )}

      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={handleSave}
          disabled={saving || (type === 'custom' && !body.trim())}
          className="px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-b from-yellow-400 to-yellow-500 text-purple-950 hover:from-yellow-300 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save preference'}
        </button>
        {saved && <p className="text-xs text-green-400/70">✓ Saved</p>}
      </div>
    </div>
  );
}
