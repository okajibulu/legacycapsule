'use client'
/* =========================================================
   components/GalleryLightbox.tsx
   Clickable image that opens a full-screen lightbox
========================================================= */
import { useState } from 'react'

export default function GalleryLightbox({ src, caption, alt, aspectRatio }: {
  src: string; caption: string; alt: string; aspectRatio?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Thumbnail — clickable */}
      <div
        onClick={() => setOpen(true)}
        style={{ cursor: 'zoom-in', width: '100%', overflow: 'hidden', position: 'relative' }}
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"
          style={{
            width: '100%',
            objectFit: 'cover',
            display: 'block',
            aspectRatio: aspectRatio ?? 'auto',
            transition: 'transform 0.3s ease',
          }}
          onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.03)')}
          onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
        />
        {/* Zoom hint overlay */}
        <div style={{
          position: 'absolute', bottom: '8px', right: '8px',
          width: '28px', height: '28px', borderRadius: '50%',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', color: 'rgba(255,255,255,0.8)',
          opacity: 0, transition: 'opacity 0.2s',
        }}
          className="zoom-hint"
        >⤢</div>
      </div>

      {/* Lightbox modal */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
        >
          {/* Close button */}
          <button
            onClick={() => setOpen(false)}
            style={{
              position: 'absolute', top: '16px', right: '16px',
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', fontSize: '20px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              lineHeight: 1,
            }}
          >×</button>

          {/* Full image */}
          <img
            src={src}
            alt={alt}
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '100%', maxHeight: '80vh',
              objectFit: 'contain', borderRadius: '12px',
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            }}
          />

          {/* Caption */}
          {caption && (
            <div
              onClick={e => e.stopPropagation()}
              style={{
                marginTop: '16px', maxWidth: '560px', width: '100%',
                padding: '12px 16px', borderRadius: '10px',
                background: 'rgba(226,195,107,0.08)',
                border: '1px solid rgba(226,195,107,0.2)',
                textAlign: 'center',
              }}
            >
              <p style={{
                fontSize: '13px', color: 'rgba(255,255,255,0.8)',
                lineHeight: 1.7, margin: 0,
              }}>{caption}</p>
            </div>
          )}

          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '12px' }}>
            Tap anywhere to close
          </p>
        </div>
      )}
    </>
  )
}
