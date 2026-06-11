'use client'

// FILE: components/CommunityStoriesClient.tsx
// Purpose: Community Stories room — interactive client island
// Used by: app/for/[slug]/stories/page.tsx
// AI10 · June 2026

import { useState } from 'react'
import type { CapsuleInfo, StoryTopic, CommunityStory } from '@/app/for/[slug]/stories/page'
import TopicContainer from '@/components/TopicContainer'
import StorySubmissionPanel from '@/components/StorySubmissionPanel'

// ── SECTION: Props ───────────────────────────────────────────

interface Props {
  capsule: CapsuleInfo
  topics: StoryTopic[]
  stories: CommunityStory[]
}

// ── SECTION: Component ───────────────────────────────────────

export default function CommunityStoriesClient({ capsule, topics, stories }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // ── SECTION: Empty State ───────────────────────────────────
  if (topics.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAFAF8]">
        <StoriesHeader capsule={capsule} onShare={() => setSubmitting(true)} />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="border-l-4 border-[#6B4C9A] pl-6 text-left">
            <p className="text-[#1A1A2E] text-lg italic leading-relaxed">
              &ldquo;This story is still being written. Be the first to share a memory,
              lesson, or experience that deserves to be remembered.&rdquo;
            </p>
          </div>
          <button
            onClick={() => setSubmitting(true)}
            className="mt-10 bg-[#6B4C9A] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#5a3d84] transition-colors"
          >
            Share a Story
          </button>
        </div>

        {submitting && (
          <StorySubmissionPanel
            capsuleId={capsule.id}
            capsuleSlug={capsule.slug}
            eventType={capsule.event_type}
            activeTopics={[]}
            onClose={() => setSubmitting(false)}
            onSuccess={() => { setSubmitting(false); setSubmitted(true) }}
          />
        )}

        {submitted && (
          <SubmittedConfirmation onDismiss={() => setSubmitted(false)} />
        )}
      </div>
    )
  }

  // ── SECTION: Topic Wall ────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <StoriesHeader capsule={capsule} onShare={() => setSubmitting(true)} />

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        {topics.map(topic => (
          <TopicContainer
            key={topic.id}
            topic={topic}
            stories={stories.filter(s => s.story_topic_id === topic.id)}
            onAddStory={() => setSubmitting(true)}
          />
        ))}
      </div>

      {/* ── SECTION: Submission Modal ───────────────────────── */}
      {submitting && (
        <StorySubmissionPanel
          capsuleId={capsule.id}
          capsuleSlug={capsule.slug}
          eventType={capsule.event_type}
          activeTopics={topics}
          onClose={() => setSubmitting(false)}
          onSuccess={() => { setSubmitting(false); setSubmitted(true) }}
        />
      )}

      {submitted && (
        <SubmittedConfirmation onDismiss={() => setSubmitted(false)} />
      )}
    </div>
  )
}

// ── SECTION: Page Header ─────────────────────────────────────

function StoriesHeader({
  capsule,
  onShare,
}: {
  capsule: CapsuleInfo
  onShare: () => void
}) {
  return (
    <header className="border-b border-[#E8E4DC] bg-white px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Capsule nav */}
        <nav className="flex gap-6 text-sm text-[#555555] mb-6">
          <a href={`/for/${capsule.slug}`} className="hover:text-[#1A1A2E] transition-colors">
            Tributes
          </a>
          <a href={`/for/${capsule.slug}/profile`} className="hover:text-[#1A1A2E] transition-colors">
            Profile
          </a>
          <span className="text-[#6B4C9A] font-medium border-b border-[#6B4C9A] pb-0.5">
            Stories
          </span>
          <a href={`/for/${capsule.slug}/legacy`} className="hover:text-[#1A1A2E] transition-colors">
            Legacy
          </a>
        </nav>

        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#1A1A2E] mb-2">
              Help Preserve This Story
            </h1>
            <p className="text-[#555555] max-w-xl">
              Share a memory, lesson, experience or story that deserves to be remembered.
            </p>
          </div>
          <button
            onClick={onShare}
            className="shrink-0 bg-[#6B4C9A] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#5a3d84] transition-colors text-sm"
          >
            Share a Story
          </button>
        </div>
      </div>
    </header>
  )
}

// ── SECTION: Submitted Confirmation ──────────────────────────

function SubmittedConfirmation({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl">
        <div className="text-4xl mb-4">📖</div>
        <h2 className="text-xl font-bold text-[#1A1A2E] mb-3">
          Your story has been received
        </h2>
        <p className="text-[#555555] text-sm mb-6 leading-relaxed">
          It will be reviewed and added to this record. Thank you for helping preserve this story.
        </p>
        <button
          onClick={onDismiss}
          className="bg-[#6B4C9A] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#5a3d84] transition-colors w-full"
        >
          Continue Reading
        </button>
      </div>
    </div>
  )
}
