'use client'

// FILE: components/StorySubmissionPanel.tsx
// Purpose: Community story submission — three options (existing topic / pool / suggest)
// Used by: CommunityStoriesClient.tsx
// AI10 · June 2026

import { useState, useRef } from 'react'
import type { StoryTopic } from '@/app/for/[slug]/stories/page'
import { DEFAULT_TOPICS_BY_EVENT_TYPE } from '@/components/TopicSelector'

// ── SECTION: Types ───────────────────────────────────────────

type Mode = 'choose' | 'existing' | 'pool' | 'suggest' | 'form'

interface FormData {
  contributor_name: string
  email: string
  relationship: string
  city: string
  country: string
  tribute_text: string
  story_topic_id: string | null
  new_topic_name: string
}

// ── SECTION: Props ───────────────────────────────────────────

interface Props {
  capsuleId: string
  capsuleSlug: string
  eventType: string
  activeTopics: StoryTopic[]
  onClose: () => void
  onSuccess: () => void
}

// ── SECTION: Component ───────────────────────────────────────

export default function StorySubmissionPanel({
  capsuleId, capsuleSlug, eventType, activeTopics, onClose, onSuccess
}: Props) {
  const [mode, setMode] = useState<Mode>('choose')
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const [selectedPoolTopic, setSelectedPoolTopic] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const poolTopics = DEFAULT_TOPICS_BY_EVENT_TYPE[eventType] ??
    DEFAULT_TOPICS_BY_EVENT_TYPE['other']

  const [form, setForm] = useState<FormData>({
    contributor_name: '',
    email: '',
    relationship: '',
    city: '',
    country: '',
    tribute_text: '',
    story_topic_id: null,
    new_topic_name: '',
  })

  function updateForm(key: keyof FormData, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  // ── SECTION: Submit ──────────────────────────────────────

  async function handleSubmit() {
    if (!form.contributor_name.trim() || !form.tribute_text.trim()) {
      setError('Please enter your name and story.')
      return
    }
    if (!form.story_topic_id && !form.new_topic_name.trim()) {
      setError('Please select or enter a story topic.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const fd = new FormData()
      fd.append('capsule_id', capsuleId)
      fd.append('capsule_slug', capsuleSlug)
      fd.append('contributor_name', form.contributor_name.trim())
      fd.append('email', form.email.trim())
      fd.append('relationship', form.relationship.trim())
      fd.append('city', form.city.trim())
      fd.append('country', form.country.trim())
      fd.append('tribute_text', form.tribute_text.trim())
      if (form.story_topic_id) fd.append('story_topic_id', form.story_topic_id)
      if (form.new_topic_name.trim()) fd.append('new_topic_name', form.new_topic_name.trim())
      if (photoFile) fd.append('photo', photoFile)

      const res = await fetch('/api/community-topics/submit', {
        method: 'POST',
        body: fd,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Submission failed')

      onSuccess()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── SECTION: Render ─────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">

        {/* ── SECTION: Modal Header ─────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0EBF8] sticky top-0 bg-white z-10">
          <h2 className="font-bold text-[#1A1A2E] text-lg">Share a Story</h2>
          <button onClick={onClose} className="text-[#555555] hover:text-[#1A1A2E] text-2xl leading-none">&times;</button>
        </div>

        <div className="px-6 py-6">

          {/* ── SECTION: Mode Choose ───────────────────── */}
          {mode === 'choose' && (
            <div className="space-y-3">
              <p className="text-[#555555] text-sm mb-5">
                Where would you like your story to appear?
              </p>
              {activeTopics.length > 0 && (
                <ModeCard
                  title="Add to an existing chapter"
                  subtitle={`${activeTopics.length} chapter${activeTopics.length !== 1 ? 's' : ''} available`}
                  onClick={() => setMode('existing')}
                />
              )}
              <ModeCard
                title="Start a new chapter"
                subtitle="Choose from available story topics"
                onClick={() => setMode('pool')}
              />
              <ModeCard
                title="Suggest a new topic"
                subtitle="Propose a topic not yet in the collection"
                onClick={() => setMode('suggest')}
              />
            </div>
          )}

          {/* ── SECTION: Existing Topics ──────────────── */}
          {mode === 'existing' && (
            <div>
              <BackButton onBack={() => setMode('choose')} />
              <p className="text-sm text-[#555555] mb-4">Choose a chapter for your story:</p>
              <div className="space-y-2 mb-6">
                {activeTopics.map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTopicId(t.id)
                      updateForm('story_topic_id', t.id)
                      setMode('form')
                    }}
                    className="w-full text-left px-4 py-3 rounded-xl border border-[#E8E4DC] hover:border-[#6B4C9A] hover:bg-[#F0EBF8] transition-colors"
                  >
                    <p className="font-medium text-[#1A1A2E] text-sm">{t.topic_name}</p>
                    <p className="text-xs text-[#555555]">{t.story_count} {t.story_count === 1 ? 'story' : 'stories'}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── SECTION: Pool Topics ──────────────────── */}
          {mode === 'pool' && (
            <div>
              <BackButton onBack={() => setMode('choose')} />
              <p className="text-sm text-[#555555] mb-4">Choose a story topic:</p>
              <div className="space-y-2 mb-6">
                {poolTopics.map((t: string) => (
                  <button
                    key={t}
                    onClick={() => {
                      setSelectedPoolTopic(t)
                      updateForm('new_topic_name', t)
                      setMode('form')
                    }}
                    className="w-full text-left px-4 py-3 rounded-xl border border-[#E8E4DC] hover:border-[#6B4C9A] hover:bg-[#F0EBF8] transition-colors"
                  >
                    <p className="font-medium text-[#1A1A2E] text-sm">{t}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── SECTION: Suggest Topic ────────────────── */}
          {mode === 'suggest' && (
            <div>
              <BackButton onBack={() => setMode('choose')} />
              <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
                Suggest a topic name
              </label>
              <input
                type="text"
                value={form.new_topic_name}
                onChange={e => updateForm('new_topic_name', e.target.value)}
                placeholder="e.g. Hostel Memories, Funny Moments..."
                className="w-full border border-[#E8E4DC] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#6B4C9A] mb-4"
              />
              <button
                disabled={!form.new_topic_name.trim()}
                onClick={() => setMode('form')}
                className="w-full bg-[#6B4C9A] text-white py-2.5 rounded-xl font-medium disabled:opacity-40 hover:bg-[#5a3d84] transition-colors"
              >
                Continue
              </button>
            </div>
          )}

          {/* ── SECTION: Story Form ───────────────────── */}
          {mode === 'form' && (
            <div>
              <BackButton onBack={() => setMode('choose')} />

              {/* Selected topic */}
              <div className="bg-[#F0EBF8] rounded-xl px-4 py-3 mb-5 text-sm">
                <span className="text-[#555555]">Chapter: </span>
                <span className="font-semibold text-[#6B4C9A]">
                  {activeTopics.find(t => t.id === form.story_topic_id)?.topic_name ??
                    form.new_topic_name}
                </span>
              </div>

              <div className="space-y-4">
                <Field label="Your Name *" required>
                  <input
                    type="text"
                    value={form.contributor_name}
                    onChange={e => updateForm('contributor_name', e.target.value)}
                    placeholder="How should we name your contribution?"
                    className="w-full border border-[#E8E4DC] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#6B4C9A]"
                  />
                </Field>

                <Field label="Your Story *" required>
                  <textarea
                    value={form.tribute_text}
                    onChange={e => updateForm('tribute_text', e.target.value)}
                    placeholder="Share a memory, lesson, or experience worth preserving..."
                    rows={6}
                    className="w-full border border-[#E8E4DC] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#6B4C9A] resize-none"
                  />
                </Field>

                <Field label="Your Relationship">
                  <input
                    type="text"
                    value={form.relationship}
                    onChange={e => updateForm('relationship', e.target.value)}
                    placeholder="e.g. Former Student, Colleague, Friend..."
                    className="w-full border border-[#E8E4DC] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#6B4C9A]"
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="City">
                    <input
                      type="text"
                      value={form.city}
                      onChange={e => updateForm('city', e.target.value)}
                      placeholder="City"
                      className="w-full border border-[#E8E4DC] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#6B4C9A]"
                    />
                  </Field>
                  <Field label="Country">
                    <input
                      type="text"
                      value={form.country}
                      onChange={e => updateForm('country', e.target.value)}
                      placeholder="Country"
                      className="w-full border border-[#E8E4DC] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#6B4C9A]"
                    />
                  </Field>
                </div>

                <Field label="Email (for notification when your story is published)">
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => updateForm('email', e.target.value)}
                    placeholder="your@email.com"
                    className="w-full border border-[#E8E4DC] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#6B4C9A]"
                  />
                </Field>

                {/* ── SECTION: Photo Upload ──────────────── */}
                <Field label="Add a Photo (optional)">
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileRef}
                    className="hidden"
                    onChange={e => setPhotoFile(e.target.files?.[0] ?? null)}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full border-2 border-dashed border-[#E8E4DC] rounded-xl px-4 py-4 text-sm text-[#555555] hover:border-[#6B4C9A] transition-colors text-center"
                  >
                    {photoFile ? `📷 ${photoFile.name}` : 'Tap to add a photo to your story'}
                  </button>
                </Field>
              </div>

              {error && (
                <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="mt-6 w-full bg-[#6B4C9A] text-white py-3 rounded-xl font-semibold disabled:opacity-50 hover:bg-[#5a3d84] transition-colors"
              >
                {loading ? 'Submitting…' : 'Submit My Story'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// ── SECTION: Sub-components ──────────────────────────────────

function ModeCard({ title, subtitle, onClick }: { title: string; subtitle: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-5 py-4 rounded-xl border border-[#E8E4DC] hover:border-[#6B4C9A] hover:bg-[#F0EBF8] transition-colors"
    >
      <p className="font-semibold text-[#1A1A2E] text-sm">{title}</p>
      <p className="text-xs text-[#555555] mt-0.5">{subtitle}</p>
    </button>
  )
}

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      onClick={onBack}
      className="text-sm text-[#6B4C9A] hover:underline mb-4 flex items-center gap-1"
    >
      ← Back
    </button>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
        {label}{required && <span className="text-[#6B4C9A] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
