'use client'

// FILE: components/TopicContainer.tsx
// Purpose: Individual story topic chapter container — fixed height, scrollable
// Used by: CommunityStoriesClient.tsx
// AI10 · June 2026

import StoryCard from '@/components/StoryCard'
import type { StoryTopic, CommunityStory } from '@/app/for/[slug]/stories/page'

// ── SECTION: Props ───────────────────────────────────────────

interface Props {
  topic: StoryTopic
  stories: CommunityStory[]
  onAddStory: () => void
}

// ── SECTION: Component ───────────────────────────────────────

export default function TopicContainer({ topic, stories, onAddStory }: Props) {
  const storyLabel = topic.story_count === 1 ? '1 Story' : `${topic.story_count} Stories`

  return (
    <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden shadow-sm">

      {/* ── SECTION: Topic Header ─────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0EBF8]">
        <div>
          <h2 className="text-lg font-bold text-[#1A1A2E]">{topic.topic_name}</h2>
          <p className="text-sm text-[#6B4C9A] mt-0.5">{storyLabel}</p>
        </div>
        <button
          onClick={onAddStory}
          className="text-sm text-[#6B4C9A] border border-[#6B4C9A] rounded-lg px-4 py-1.5 hover:bg-[#F0EBF8] transition-colors font-medium"
        >
          Add Your Story
        </button>
      </div>

      {/* ── SECTION: Scrollable Story List ───────────────── */}
      <div
        className="overflow-y-auto divide-y divide-[#F5F3EE]"
        style={{ maxHeight: '420px' }}
      >
        {stories.map(story => (
          <StoryCard key={story.id} story={story} />
        ))}

        {stories.length === 0 && (
          <div className="px-6 py-10 text-center text-[#555555] text-sm italic">
            Be the first to share a story in this chapter.
          </div>
        )}
      </div>

    </div>
  )
}
