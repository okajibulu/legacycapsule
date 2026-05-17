'use client';

/**
 * ============================================================
 * LEGACYCAPSULE — components/honouree/WaysToHonourCard.tsx
 * VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 *
 * Displays a single payment method card on the public profile page.
 * Account number is already masked server-side before this component
 * receives it — this component never sees the full number.
 *
 * Includes the GiftAcknowledgeForm inline — expands on button click.
 */

import { useState } from 'react';

// ============================================================
// SECTION 1 — Types
// ============================================================

interface SupportAccount {
  id:              string;
  method_label:    string;
  account_holder:  string;
  bank_name:       string | null;
  account_number:  string;  // already masked — last 4 digits only
  reference_guide: string | null;
  currency:        string;
  sort_order:      number;
}

interface WaysToHonourCardProps {
  account:          SupportAccount;
  capsuleId:        string;
  acknowledgeLabel: string;
}


// ============================================================
// SECTION 2 — GiftAcknowledgeForm (inline, expands on click)
// ============================================================

function GiftAcknowledgeForm({
  accountId,
  capsuleId,
  onClose,
}: {
  accountId: string;
  capsuleId: string;
  onClose:   () => void;
}) {
  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [sending, setSending] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Please enter your name.'); return; }
    setSending(true); setError(null);

    const res = await fetch('/api/honouree/acknowledgement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        capsule_id:         capsuleId,
        support_account_id: accountId,
        supporter_name:     name.trim(),
        supporter_email:    email.trim() || undefined,
      }),
    });

    setSending(false);
    if (res.ok) {
      setDone(true);
    } else {
      const d = await res.json();
      setError(d.error ?? 'Something went wrong. Please try again.');
    }
  };

  const inputClass = `
    w-full px-3 py-2.5 rounded-lg text-sm
    bg-[#2D1B69]/20 border border-[#2D1B69]/30
    text-[#1C1C1E] placeholder:text-[#5F5E5A]/60
    focus:outline-none focus:border-[#B8960C]/40
  `;

  if (done) {
    return (
      <div className="mt-3 rounded-xl bg-[#2D1B69]/8 border border-[#B8960C]/20 p-4 text-center">
        <p className="text-[#2D1B69] text-sm font-medium mb-1">Thank you — noted with gratitude.</p>
        {email && (
          <p className="text-[#5F5E5A] text-xs">A thank-you note will be sent to {email}.</p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl bg-[#2D1B69]/5 border border-[#B8960C]/20 p-4 space-y-3">
      <p className="text-[#2D1B69] text-xs font-medium">Let them know</p>

      <input
        type="text"
        placeholder="Your name *"
        value={name}
        onChange={e => { setName(e.target.value); setError(null); }}
        className={inputClass}
      />
      <div>
        <input
          type="email"
          placeholder="Your email (optional — to receive a thank-you)"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className={inputClass}
        />
        <p className="text-[10px] text-[#5F5E5A]/60 mt-1 px-1">
          Leave your email to receive a personal thank-you.
        </p>
      </div>

      {error && (
        <p className="text-xs text-red-600/70">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={sending}
          className="
            flex-1 py-2.5 rounded-xl text-sm font-bold
            bg-[#2D1B69] text-[#F5F3EE]
            hover:bg-[#3d2580] transition-colors
            disabled:opacity-50
          "
        >
          {sending ? 'Recording…' : 'Confirm'}
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl text-sm border border-[#2D1B69]/20 text-[#5F5E5A] hover:border-[#2D1B69]/40 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}


// ============================================================
// SECTION 3 — WaysToHonourCard component
// ============================================================

export default function WaysToHonourCard({
  account,
  capsuleId,
  acknowledgeLabel,
}: WaysToHonourCardProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="rounded-xl border border-[#B8960C]/20 bg-white p-5 shadow-sm">

      {/* Method label + currency */}
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#B8960C]">
          {account.method_label}
        </p>
        <p className="text-[10px] text-[#5F5E5A] font-medium">{account.currency}</p>
      </div>

      {/* Account details */}
      <div className="space-y-1.5 mb-4">
        <div className="flex justify-between">
          <p className="text-[10px] text-[#5F5E5A]/60 uppercase tracking-wider">Account holder</p>
          <p className="text-sm text-[#1C1C1E] font-medium">{account.account_holder}</p>
        </div>
        {account.bank_name && (
          <div className="flex justify-between">
            <p className="text-[10px] text-[#5F5E5A]/60 uppercase tracking-wider">Bank</p>
            <p className="text-sm text-[#1C1C1E]">{account.bank_name}</p>
          </div>
        )}
        {account.account_number && (
          <div className="flex justify-between">
            <p className="text-[10px] text-[#5F5E5A]/60 uppercase tracking-wider">Account number</p>
            <p className="text-sm text-[#1C1C1E] font-mono">{account.account_number}</p>
          </div>
        )}
      </div>

      {/* Reference guide */}
      {account.reference_guide && (
        <div className="rounded-lg bg-[#F5F3EE] px-3 py-2 mb-4">
          <p className="text-[10px] text-[#5F5E5A] leading-relaxed">
            {account.reference_guide}
          </p>
        </div>
      )}

      {/* Gold rule */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-[#B8960C]/30 to-transparent mb-4" />

      {/* Acknowledge button */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="
            w-full py-3 rounded-xl text-sm font-medium
            border border-[#2D1B69]/20 text-[#2D1B69]
            hover:bg-[#2D1B69]/5 hover:border-[#2D1B69]/40
            transition-colors
          "
        >
          {acknowledgeLabel}
        </button>
      ) : (
        <GiftAcknowledgeForm
          accountId={account.id}
          capsuleId={capsuleId}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
