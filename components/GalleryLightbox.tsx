'use client'
/* =========================================================
   components/GalleryLightbox.tsx
   → components/GalleryLightbox.tsx
   
   Clickable image → full-screen lightbox with caption
   and public photo comments.
   
   Comments: any name, public, posted instantly.
========================================================= */
import { useState, useEffect } from 'react'

interface Comment {
  id: string
  commenter_name: string
  comment_text: string
  created_at: string
}

interface Props {
  src: string
  caption: string
  alt: string
  aspectRatio?: string
  photoId?: string      // needed for comments
  capsuleId?: string    // needed for comments
}

function formatTime(s: string) {
  const d = new Date(s)
  return `${String(d.getDate()).padStart(2,'0')} ${d.toLocaleString('en-GB',{month:'short'})} ${d.getFullYear()}`
}

export default function GalleryLightbox({ src, caption, alt, aspectRatio, photoId, capsuleId }: Props) {
  const [open, setOpen] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)
  const [posted, setPosted] = useState(false)

  useEffect(() => {
    if (open && photoId) {
      setLoadingComments(true)
      fetch(`/api/gallery/comment?photoId=${photoId}`)
        .then(r => r.json())
        .then(d => setComments(d.comments ?? []))
        .catch(() => {})
        .finally(() => setLoadingComments(false))
    }
  }, [open, photoId])

  const handleComment = async () => {
    if (!name.trim() || !text.trim() || !photoId || !capsuleId) return
    setPosting(true)
    try {
      const res = await fetch('/api/gallery/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, capsuleId, commenterName: name.trim(), commentText: text.trim() }),
      })
      const data = await res.json()
      if (data.comment) {
        setComments(prev => [...prev, data.comment])
        setText('')
        setPosted(true)
        setTimeout(() => setPosted(false), 3000)
      }
    } catch {}
    setPosting(false)
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '13px',
    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(226,195,107,0.18)',
    color: 'rgba(255,255,255,0.9)', outline: 'none', fontFamily: "'DM Sans', sans-serif",
    boxSizing: 'border-box' as const,
  }

  return (
    <>
      {/* Thumbnail */}
      <div
        onClick={() => setOpen(true)}
        style={{ cursor: 'zoom-in', width: '100%', overflow: 'hidden', position: 'relative' }}
      >
        <img
          src={src} alt={alt} loading="lazy"
          style={{ width: '100%', objectFit: 'cover', display: 'block', aspectRatio: aspectRatio ?? 'auto', transition: 'transform 0.3s ease' }}
          onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.03)')}
          onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
        />
        {/* Expand hint */}
        <div style={{ position: 'absolute', bottom: '8px', right: '8px', width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>⤢</div>
      </div>

      {/* Lightbox */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.94)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto', padding: '16px' }}
        >
          {/* Close */}
          <button onClick={() => setOpen(false)} style={{ position: 'fixed', top: '16px', right: '16px', width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 101 }}>×</button>

          <div style={{ width: '100%', maxWidth: '600px', paddingTop: '48px' }} onClick={e => e.stopPropagation()}>
            {/* Full image */}
            <img src={src} alt={alt} style={{ width: '100%', objectFit: 'contain', borderRadius: '12px', maxHeight: '70vh', display: 'block', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }} />

            {/* Caption */}
            {caption && (
              <div style={{ marginTop: '12px', padding: '12px 16px', borderRadius: '10px', background: 'rgba(226,195,107,0.07)', border: '1px solid rgba(226,195,107,0.15)' }}>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{caption}</p>
              </div>
            )}

            {/* Comments section */}
            {photoId && capsuleId && (
              <div style={{ marginTop: '20px' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'rgba(226,195,107,0.55)', marginBottom: '12px' }}>
                  Comments {comments.length > 0 && `· ${comments.length}`}
                </p>

                {/* Existing comments */}
                {loadingComments ? (
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>Loading…</p>
                ) : comments.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {comments.map(c => (
                      <div key={c.id} style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{c.commenter_name}</span>
                          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{formatTime(c.created_at)}</span>
                        </div>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.65, margin: 0 }}>{c.comment_text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', fontStyle: 'italic', marginBottom: '16px' }}>No comments yet. Be the first.</p>
                )}

                {/* Post comment */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input style={inp} placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
                  <textarea style={{ ...inp, resize: 'none' as const, lineHeight: 1.6 }} placeholder="Leave a comment on this photo…" rows={3} value={text} onChange={e => setText(e.target.value)} />
                  <button
                    onClick={handleComment}
                    disabled={posting || !name.trim() || !text.trim()}
                    style={{ padding: '9px', borderRadius: '10px', background: name.trim() && text.trim() ? 'rgba(226,195,107,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${name.trim() && text.trim() ? 'rgba(226,195,107,0.35)' : 'rgba(255,255,255,0.06)'}`, color: name.trim() && text.trim() ? '#E2C36B' : 'rgba(255,255,255,0.25)', fontSize: '13px', fontWeight: 700, cursor: name.trim() && text.trim() ? 'pointer' : 'not-allowed', opacity: posting ? 0.7 : 1 }}
                  >
                    {posting ? 'Posting…' : posted ? '✓ Posted' : 'Post Comment'}
                  </button>
                </div>
              </div>
            )}

            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.18)', textAlign: 'center', marginTop: '20px', marginBottom: '8px' }}>Tap anywhere outside to close</p>
          </div>
        </div>
      )}
    </>
  )
}
