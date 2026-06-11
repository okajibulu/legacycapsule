// FILE: components/TopicSelector.tsx
// Purpose: Event-type-aware default topic lists for submission panel
// Used by: StorySubmissionPanel.tsx
// AI10 · June 2026

// ── SECTION: Default Topics by Event Type ───────────────────

export const DEFAULT_TOPICS_BY_EVENT_TYPE: Record<string, string[]> = {
  retirement: [
    'A Lesson I Learned',
    'A Moment I\'ll Never Forget',
    'Career Stories',
    'Something They Always Said',
    'How We First Met',
    'A Time They Made a Difference',
  ],
  memorial: [
    'What I Will Always Remember',
    'A Story They Would Have Loved',
    'Something They Taught Me',
    'A Moment We Shared',
    'How They Changed My Life',
    'What I Wish I Had Said',
  ],
  funeral: [
    'What I Will Always Remember',
    'A Story They Would Have Loved',
    'Something They Taught Me',
    'A Moment We Shared',
    'How They Changed My Life',
    'What I Wish I Had Said',
  ],
  wedding: [
    'How I Know The Couple',
    'Marriage Advice',
    'A Memory Worth Sharing',
    'Something I Wish For Them',
    'How They Found Each Other',
    'A Funny Story',
  ],
  birthday: [
    'A Favourite Memory',
    'Something I\'ve Always Wanted To Say',
    'A Funny Moment',
    'What They Mean To Me',
    'A Lesson They Taught Me',
    'How We Met',
  ],
  chieftaincy: [
    'How I Know Them',
    'What This Achievement Means',
    'A Story Worth Telling',
    'An Encounter I\'ll Never Forget',
    'Their Impact On The Community',
    'Words of Honour',
  ],
  recognition: [
    'How I Know Them',
    'What This Achievement Means',
    'A Story Worth Telling',
    'An Encounter I\'ll Never Forget',
    'Their Impact',
    'Words of Honour',
  ],
  graduation: [
    'A Lesson That Helped Me',
    'Something I\'m Proud Of Them For',
    'Advice For What Comes Next',
    'A Memory From The Journey',
    'What I Know About Their Future',
    'How They Inspired Me',
  ],
  other: [
    'A Memory Worth Preserving',
    'A Lesson I Learned',
    'How We Met',
    'A Moment I\'ll Never Forget',
    'Something They Always Said',
    'A Story Worth Telling',
  ],
}
