'use client'
/* =========================================================
   components/SectionReactions.tsx
   Emoji reactions on profile page sections
========================================================= */
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const EMOJIS = ['❤️', '🙏', '✦', '😢', '👏', '🕊️']
const gold = '#E2C36B'

export default function SectionReactions({ sectionId, capsuleId }: {
  sectionId: string; capsuleId: string
}) {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [myReactions, setMyReactions] = useState<string[]>([])

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('section_reactions')
        .select('emoji')
        .eq('section_id', sectionId)
      const tally: Record<string, number> = {}
      data?.forEach(r => { tally[r.emoji] = (tally[r.emoji] ?? 0) + 1 })
      setCounts(tally)
    }
    load()
    const stored = localStorage.getItem(`sec_reactions_${sectionId}`)
    if (stored) setMyReactions(JSON.parse(stored))
  }, [sectionId])

  const handleReact = async (emoji: string) => {
    const res = await fetch('/api/section/react', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sectionId, capsuleId, emoji }),
    })
    const data = await res.json()
    if (data.action === 'added') {
      setCounts(prev => ({ ...prev, [emoji]: (prev[emoji] ?? 0) + 1 }))
      const updated = [...myReactions, emoji]
      setMyReactions(updated)
      localStorage.setItem(`sec_reactions_${sectionId}`, JSON.stringify(updated))
    } else {
      setCounts(prev => ({ ...prev, [emoji]: Math.max(0, (prev[emoji] ?? 1) - 1) }))
      const updated = myReactions.filter(r => r !== emoji)
      setMyReactions(updated)
      localStorage.setItem(`sec_reactions_${sectionId}`, JSON.stringify(updated))
    }
  }

  return (
    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '12px' }}>
      {EMOJIS.map(emoji => {
        const count = counts[emoji] ?? 0
        const isMine = myReactions.includes(emoji)
        return (
          <button
            key={emoji}
            onClick={() => handleReact(emoji)}
            style={{
              display: 'flex', alignItems: 'center', gap: '3px',
              padding: '3px 8px', borderRadius: '20px', cursor: 'pointer',
              fontSize: '13px', lineHeight: 1, outline: 'none',
              border: `1px solid ${isMine ? 'rgba(226,195,107,0.5)' : 'rgba(255,255,255,0.1)'}`,
              background: isMine ? 'rgba(226,195,107,0.1)' : 'rgba(255,255,255,0.04)',
              transition: 'all 0.15s',
            }}
          >
            <span>{emoji === '✦' ? <span style={{ color: gold, fontSize: '11px' }}>✦</span> : emoji}</span>
            {count > 0 && <span style={{ fontSize: '10px', color: isMine ? gold : 'rgba(255,255,255,0.35)', fontWeight: isMine ? 700 : 400 }}>{count}</span>}
          </button>
        )
      })}
    </div>
  )
}
