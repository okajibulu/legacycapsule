'use client'

// FILE: components/StoryCard.tsx
// Purpose: Individual community story display card — text-first, optional photo
// Used by: TopicContainer.tsx
// AI10 · June 2026

import { useState } from 'react'
import Image from 'next/image'
import type { CommunityStory } from '@/app/for/[slug]/stories/page'

// ── SECTION: Props ───────────────────────────────────────────

interface Props {
  story: CommunityStory
}

// ── SECTION: Helpers ─────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ── SECTION: Component ───────────────────────────────────────

export default function StoryCard({ story }: Props) {
  const [expanded, setExpanded] = useState(false)
  const isLong = story.tribute_text.length > 400
  const displayText = isLong && !expanded
    ? story.tribute_text.slice(0, 400) + '…'
    : story.tribute_text

  const location = [story.city, story.country].filter(Boolean).join(', ')

  return (
    <div className="px-6 py-5 bg-[#F5F3EE] m-4 rounded-xl">

      {/* ── SECTION: Contributor Identity ──────────────────── */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-full bg-[#6B4C9A] text-white flex items-center justify-center text-xs font-bold shrink-0">
          {getInitials(story.contributor_name)}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-[#1A1A2E] text-sm truncate">
            {story.contributor_name}
          </p>
          <p className="text-xs text-[#555555] truncate">
            {[story.relationship, location].filter(Boolean).join(' · ')}
          </p>
        </div>
        <p className="ml-auto text-xs text-[#555555] shrink-0">
          {formatDate(story.created_at)}
        </p>
      </div>

      {/* ── SECTION: Optional Photo ──────────────────────── */}
      {story.thumbnail_url && (
        <div className="mb-4 rounded-lg overflow-hidden">
          <Image
            src={story.thumbnail_url}
            alt={`Photo by ${story.contributor_name}`}
            width={640}
            height={360}
            className="w-full object-cover max-h-52"
          />
        </div>
      )}

      {/* ── SECTION: Story Text ───────────────────────────── */}
      <p className="text-[#1A1A2E] text-sm leading-relaxed whitespace-pre-wrap">
        {displayText}
      </p>

      {isLong && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-2 text-xs text-[#6B4C9A] hover:underline font-medium"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}

    </div>
  )
}
