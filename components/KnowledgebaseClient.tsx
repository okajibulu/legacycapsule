'use client';

/**
 * ============================================================
 * LEGACYCAPSULE — components/KnowledgebaseClient.tsx
 * VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 *
 * Client component handling search, filtering, and article
 * expand/collapse interactions for the /help page.
 *
 * Search behaviour:
 *   - Searches title, content, and tags simultaneously
 *   - Results appear as expandable cards — title visible,
 *     content revealed on click
 *   - Related articles suggested below each open article
 *   - No pagination — search filters instead of pages
 *   - Empty query shows category groups with article counts
 */

import { useState, useMemo, useCallback } from 'react';
import type { KnowledgeArticle }           from '@/app/help/page';


// ============================================================
// SECTION 1 — Props
// ============================================================

interface KnowledgebaseClientProps {
  articles:       KnowledgeArticle[];
  categoryLabels: Record<string, string>;
}


// ============================================================
// SECTION 2 — Search utility
// Simple token-based search across title (weight A), tags (B),
// content (C). Returns results sorted by relevance score.
// ============================================================

function searchArticles(articles: KnowledgeArticle[], query: string): KnowledgeArticle[] {
  if (!query.trim()) return [];
  const tokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);
  if (tokens.length === 0) return [];

  const scored = articles.map(article => {
    let score = 0;
    const title   = article.title.toLowerCase();
    const content = article.content.toLowerCase();
    const tags    = article.tags.join(' ').toLowerCase();

    tokens.forEach(token => {
      if (title.includes(token))   score += 10;
      if (tags.includes(token))    score += 6;
      if (content.includes(token)) score += 2;
    });

    return { article, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(s => s.article);
}


// ============================================================
// SECTION 3 — Individual article card
// ============================================================

function ArticleCard({
  article,
  isOpen,
  onToggle,
  related,
}: {
  article:  KnowledgeArticle;
  isOpen:   boolean;
  onToggle: () => void;
  related:  KnowledgeArticle[];
}) {
  return (
    <div
      className={`
        rounded-xl border overflow-hidden transition-all duration-200
        ${isOpen
          ? 'border-[#B8960C]/30 bg-white shadow-sm'
          : 'border-[#B8960C]/10 bg-white hover:border-[#B8960C]/25 hover:shadow-sm'
        }
      `}
    >
      {/* Header — always visible */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`article-${article.id}`}
        className="
          w-full flex items-center justify-between gap-3
          px-5 py-4 text-left
        "
      >
        <p className={`text-sm font-medium leading-snug transition-colors ${
          isOpen ? 'text-[#2D1B69]' : 'text-[#1C1C1E]'
        }`}>
          {article.title}
        </p>
        <span
          aria-hidden="true"
          className={`
            flex-shrink-0 w-5 h-5 rounded-full
            flex items-center justify-center text-[10px]
            transition-all duration-200
            ${isOpen
              ? 'bg-[#2D1B69] text-[#F5F3EE] rotate-180'
              : 'bg-[#2D1B69]/10 text-[#2D1B69]'
            }
          `}
        >
          ▾
        </span>
      </button>

      {/* Content — revealed on open */}
      {isOpen && (
        <div id={`article-${article.id}`}>
          {/* Gold rule */}
          <div className="h-[1px] bg-gradient-to-r from-transparent via-[#B8960C]/30 to-transparent mx-5" />

          <div className="px-5 py-4">
            <p className="text-[#1C1C1E] text-sm leading-relaxed whitespace-pre-wrap">
              {article.content}
            </p>

            {/* Tags */}
            {article.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {article.tags.slice(0, 5).map(tag => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-[#2D1B69]/5 text-[#2D1B69]/60"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Related articles */}
            {related.length > 0 && (
              <div className="mt-5 pt-4 border-t border-[#B8960C]/10">
                <p className="text-[10px] text-[#5F5E5A]/60 uppercase tracking-wider mb-2">
                  Related
                </p>
                <div className="space-y-1">
                  {related.slice(0, 3).map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        // Signal parent to open this article
                        document.dispatchEvent(
                          new CustomEvent('open-article', { detail: r.id })
                        );
                      }}
                      className="
                        w-full text-left text-xs text-[#2D1B69]/70
                        hover:text-[#2D1B69] transition-colors py-1
                        flex items-center gap-1.5
                      "
                    >
                      <span aria-hidden="true" className="text-[#B8960C]/50">→</span>
                      {r.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


// ============================================================
// SECTION 4 — Main client component
// ============================================================

export default function KnowledgebaseClient({
  articles,
  categoryLabels,
}: KnowledgebaseClientProps) {
  const [query,    setQuery]    = useState('');
  const [openIds,  setOpenIds]  = useState<Set<string>>(new Set());

  const results = useMemo(
    () => searchArticles(articles, query),
    [articles, query]
  );

  const isSearching = query.trim().length > 1;

  // Group articles by category for browse mode
  const byCategory = useMemo(() => {
    const groups: Record<string, KnowledgeArticle[]> = {};
    articles.forEach(a => {
      if (!groups[a.category]) groups[a.category] = [];
      groups[a.category].push(a);
    });
    return groups;
  }, [articles]);

  const toggleArticle = useCallback((id: string) => {
    setOpenIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // Related articles — same category, not the same article
  const getRelated = useCallback((article: KnowledgeArticle) => {
    return articles
      .filter(a => a.category === article.category && a.id !== article.id)
      .slice(0, 3);
  }, [articles]);


  // ── 4.1  Render ───────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {/* Search field */}
      <div className="relative mb-8">
        <div
          aria-hidden="true"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5F5E5A]/40"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
            <line x1="10.5" y1="10.5" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <input
          type="search"
          placeholder="Search — e.g. how do I submit a tribute…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label="Search knowledgebase"
          className="
            w-full pl-10 pr-4 py-3.5 rounded-xl text-sm
            bg-white border border-[#B8960C]/20
            text-[#1C1C1E] placeholder:text-[#5F5E5A]/50
            shadow-sm
            focus:outline-none focus:border-[#B8960C]/50 focus:ring-2 focus:ring-[#B8960C]/10
          "
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5F5E5A]/40 hover:text-[#5F5E5A] transition-colors"
          >
            ✕
          </button>
        )}
      </div>


      {/* Search results */}
      {isSearching && (
        <div>
          <p className="text-xs text-[#5F5E5A]/60 mb-4">
            {results.length === 0
              ? `No results for "${query}"`
              : `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`}
          </p>

          {results.length === 0 ? (
            <div className="rounded-xl border border-[#B8960C]/10 bg-white p-8 text-center">
              <p className="text-[#5F5E5A] text-sm mb-2">No matches found.</p>
              <p className="text-[#5F5E5A]/60 text-xs">
                Try different words, or{' '}
                <a href="mailto:hello@itslegacycapsule.com" className="text-[#2D1B69] hover:underline">
                  contact us
                </a>
                .
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {results.map(article => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  isOpen={openIds.has(article.id)}
                  onToggle={() => toggleArticle(article.id)}
                  related={getRelated(article)}
                />
              ))}
            </div>
          )}
        </div>
      )}


      {/* Browse mode — category groups (shown when not searching) */}
      {!isSearching && (
        <div className="space-y-8">
          {Object.entries(byCategory).map(([category, catArticles]) => (
            <section key={category} aria-label={categoryLabels[category] ?? category}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-[#B8960C]">
                  {categoryLabels[category] ?? category}
                </h2>
                <div className="flex-1 h-[1px] bg-[#B8960C]/15" aria-hidden="true" />
                <p className="text-[10px] text-[#5F5E5A]/50">
                  {catArticles.length} article{catArticles.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="space-y-2">
                {catArticles.map(article => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    isOpen={openIds.has(article.id)}
                    onToggle={() => toggleArticle(article.id)}
                    related={getRelated(article)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

    </div>
  );
}
