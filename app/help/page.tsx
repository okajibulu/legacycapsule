/**
 * ============================================================
 * LEGACYCAPSULE — app/help/page.tsx
 * VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 *
 * Public knowledgebase at /help (D53).
 *
 * Design rules:
 *   - Search field prominent at top — not a FAQ wall
 *   - Content revealed on query — not presented all at once
 *   - Topics fuse How-To, What-Is, and feature discovery
 *   - Serves dual purpose: user support + LC feature marketing
 *
 * Phase 1: server component for initial render, client search
 * interaction via KnowledgebaseClient component.
 * Phase 2: analytics-driven most-searched topic surfacing.
 */

import { createClient }        from '@supabase/supabase-js';
import KnowledgebaseClient     from '@/components/KnowledgebaseClient';

// ============================================================
// SECTION 1 — Data fetch (server-side)
// Pre-fetch all published articles for client-side search.
// Full-text search runs in the browser against this dataset.
// At Phase 2 scale, move search to a server action.
// ============================================================

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface KnowledgeArticle {
  id:       string;
  slug:     string;
  category: string;
  title:    string;
  content:  string;
  tags:     string[];
}

const CATEGORY_LABELS: Record<string, string> = {
  getting_started: 'Getting started',
  tributes:        'Tributes',
  packages:        'Packages',
  organisers:      'For organisers',
  for_family:      'For family & representatives',
  privacy:         'Privacy & data',
  technical:       'Technical',
};


// ============================================================
// SECTION 2 — Page component
// ============================================================

export default async function HelpPage() {
  const { data: articles } = await adminClient
    .from('lc_knowledge')
    .select('id, slug, category, title, content, tags')
    .eq('is_published', true)
    .order('sort_order');

  const allArticles = (articles ?? []) as KnowledgeArticle[];

  return (
    <div className="min-h-screen bg-[#F5F3EE]">

      {/* ── Hero ──────────────────────────────────────────── */}
      <div className="bg-[#2D1B69] py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[10px] text-yellow-400/50 uppercase tracking-[0.25em] mb-3">
            LegacyCapsule
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            How can we help?
          </h1>
          <p className="text-white/50 text-sm mb-8">
            Search for answers, guides, and feature explanations.
          </p>

          {/* Search is handled by the client component below */}
          <div id="search-anchor" />
        </div>
      </div>

      {/* Gold rule */}
      <div className="h-[3px] bg-gradient-to-r from-transparent via-[#B8960C] to-transparent" />

      {/* ── Client search and results ─────────────────────── */}
      <KnowledgebaseClient
        articles={allArticles}
        categoryLabels={CATEGORY_LABELS}
      />

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="bg-[#2D1B69] py-10 mt-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-white/30 text-sm mb-2">
            Can't find what you're looking for?
          </p>
          <a
            href="mailto:hello@itslegacycapsule.com"
            className="text-yellow-400/70 hover:text-yellow-400 text-sm transition-colors"
          >
            hello@itslegacycapsule.com
          </a>
          <div className="mt-6 pt-6 border-t border-white/10">
            <a href="/" className="text-white/20 hover:text-white/40 text-xs transition-colors">
              ← Back to LegacyCapsule
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}


// ============================================================
// SECTION 3 — Metadata
// ============================================================

export async function generateMetadata() {
  return {
    title:       'Help & Knowledgebase | LegacyCapsule',
    description: 'Answers, guides, and feature explanations for LegacyCapsule — the premium event memory platform.',
  };
}
