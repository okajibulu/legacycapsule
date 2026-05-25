'use client'
/* =========================================================
   components/GalleryEditor.tsx
   Photo + description gallery editor for manage dashboard.
   - Up to 3 gallery sections
   - Up to 10 photos per section
   - Each row: photo left, description right (desktop)
   - + button adds row, × removes
   - Saves to capsule_gallery table
========================================================= */
import { useState, useRef } from 'react'

interface GalleryPhoto {
  id?: string
  image_url: string
  description: string
  sort_order: number
  section_index: number
  isNew?: boolean
  file?: File
}

interface Props {
  capsuleId: string
  initialPhotos: GalleryPhoto[]
  supabase: any
  t: {
    accentPrimary: string; accentFaint: string; accentMuted: string
    cardBg: string; cardBorder: string; textPrimary: string
    textBody: string; textFaint: string; inputBg: string; inputBorder: string
  }
  onSaved?: () => void
}

const MAX_SECTIONS = 3
const MAX_PER_SECTION = 10
const BUCKET = 'tribute-photos'

export default function GalleryEditor({ capsuleId, initialPhotos, supabase, t, onSaved }: Props) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>(initialPhotos ?? [])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Group photos by section
  const sections = Array.from({ length: MAX_SECTIONS }, (_, si) =>
    photos.filter(p => p.section_index === si).sort((a, b) => a.sort_order - b.sort_order)
  )

  const addPhoto = (sectionIdx: number) => {
    const sectionPhotos = sections[sectionIdx]
    if (sectionPhotos.length >= MAX_PER_SECTION) return
    const newPhoto: GalleryPhoto = {
      image_url: '', description: '',
      sort_order: sectionPhotos.length,
      section_index: sectionIdx, isNew: true,
    }
    setPhotos(prev => [...prev, newPhoto])
  }

  const removePhoto = (sectionIdx: number, sortOrder: number) => {
    setPhotos(prev => prev.filter(p => !(p.section_index === sectionIdx && p.sort_order === sortOrder)))
  }

  const updateDescription = (sectionIdx: number, sortOrder: number, desc: string) => {
    setPhotos(prev => prev.map(p =>
      p.section_index === sectionIdx && p.sort_order === sortOrder ? { ...p, description: desc } : p
    ))
  }

  const handleFileSelect = async (sectionIdx: number, sortOrder: number, file: File) => {
    const preview = URL.createObjectURL(file)
    setPhotos(prev => prev.map(p =>
      p.section_index === sectionIdx && p.sort_order === sortOrder
        ? { ...p, image_url: preview, file } : p
    ))
  }

  const handleSave = async () => {
    setSaving(true); setMsg('')
    try {
      for (const photo of photos) {
        if (photo.file) {
          // Upload new photo
          const ext = photo.file.name.split('.').pop() ?? 'jpg'
          const path = `gallery/${capsuleId}/${photo.section_index}-${photo.sort_order}-${Date.now()}.${ext}`
          const { error: ue } = await supabase.storage.from(BUCKET).upload(path, photo.file, { upsert: true })
          if (ue) continue
          const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl

          if (photo.id) {
            await supabase.from('capsule_gallery').update({
              image_url: url, description: photo.description,
              sort_order: photo.sort_order, section_index: photo.section_index,
            }).eq('id', photo.id)
          } else {
            const { data } = await supabase.from('capsule_gallery').insert({
              capsule_id: capsuleId, image_url: url,
              description: photo.description, sort_order: photo.sort_order,
              section_index: photo.section_index,
            }).select('id').single()
            if (data?.id) {
              setPhotos(prev => prev.map(p =>
                p === photo ? { ...p, id: data.id, image_url: url, file: undefined, isNew: false } : p
              ))
            }
          }
        } else if (photo.id) {
          // Update description only
          await supabase.from('capsule_gallery').update({
            description: photo.description,
            sort_order: photo.sort_order,
          }).eq('id', photo.id)
        }
      }
      setMsg('✓ Gallery saved')
      onSaved?.()
    } catch (err) {
      setMsg('Failed to save. Please try again.')
    }
    setSaving(false)
    setTimeout(() => setMsg(''), 3000)
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: '8px',
    background: t.inputBg, border: `1px solid ${t.inputBorder}`,
    color: t.textPrimary, fontSize: '13px', outline: 'none',
    fontFamily: "'DM Sans', sans-serif", resize: 'vertical' as const,
    boxSizing: 'border-box' as const, lineHeight: 1.5,
  }

  return (
    <div>
      {Array.from({ length: MAX_SECTIONS }, (_, si) => {
        const sectionPhotos = sections[si]
        const hasPhotos = sectionPhotos.length > 0
        if (si > 0 && sections[si - 1].length === 0) return null // don't show empty sections beyond first gap

        return (
          <div key={si} style={{ marginBottom: '32px' }}>
            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: t.accentMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Gallery {si + 1}
              </p>
              <div style={{ flex: 1, height: '1px', background: `rgba(226,195,107,0.1)` }} />
              <p style={{ fontSize: '10px', color: t.textFaint }}>{sectionPhotos.length}/{MAX_PER_SECTION}</p>
            </div>

            {/* Photo rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px' }}>
              {sectionPhotos.map((photo, idx) => (
                <div key={`${si}-${photo.sort_order}`} style={{
                  display: 'grid', gridTemplateColumns: '120px 1fr auto',
                  gap: '12px', alignItems: 'start',
                  padding: '12px', borderRadius: '12px',
                  background: t.cardBg, border: `1px solid ${t.cardBorder}`,
                }}>
                  {/* Photo */}
                  <div>
                    {photo.image_url ? (
                      <div style={{ position: 'relative' }}>
                        <img src={photo.image_url} alt="" style={{ width: '100%', height: '90px', objectFit: 'cover', borderRadius: '8px', display: 'block' }} />
                        <button
                          onClick={() => fileRefs.current[`${si}-${photo.sort_order}`]?.click()}
                          style={{ position: 'absolute', bottom: '4px', right: '4px', fontSize: '10px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(0,0,0,0.7)', color: 'rgba(255,255,255,0.8)', border: 'none', cursor: 'pointer' }}
                        >Change</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileRefs.current[`${si}-${photo.sort_order}`]?.click()}
                        style={{ width: '100%', height: '90px', borderRadius: '8px', border: `1px dashed ${t.accentFaint}`, background: 'transparent', cursor: 'pointer', color: t.accentMuted, fontSize: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >+</button>
                    )}
                    <input
                      ref={el => { fileRefs.current[`${si}-${photo.sort_order}`] = el }}
                      type="file" accept="image/*"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(si, photo.sort_order, f) }}
                      style={{ display: 'none' }}
                    />
                  </div>

                  {/* Description */}
                  <textarea
                    value={photo.description}
                    onChange={e => updateDescription(si, photo.sort_order, e.target.value)}
                    placeholder="Add a caption or description for this photo…"
                    rows={3}
                    style={inp}
                    maxLength={300}
                  />

                  {/* Remove */}
                  <button
                    onClick={() => removePhoto(si, photo.sort_order)}
                    style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', background: 'rgba(248,113,113,0.1)', color: 'rgba(248,113,113,0.7)', cursor: 'pointer', fontSize: '14px', marginTop: '4px' }}
                  >×</button>
                </div>
              ))}
            </div>

            {/* Add photo button */}
            {sectionPhotos.length < MAX_PER_SECTION && (
              <button
                onClick={() => addPhoto(si)}
                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px dashed ${t.accentFaint}`, background: 'transparent', color: t.accentMuted, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <span style={{ fontSize: '18px' }}>+</span> Add photo to Gallery {si + 1}
              </button>
            )}
          </div>
        )
      })}

      {/* Save */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ padding: '10px 24px', borderRadius: '10px', background: saving ? 'rgba(226,195,107,0.12)' : `linear-gradient(135deg, ${t.accentPrimary}, rgba(226,195,107,0.7))`, color: saving ? 'rgba(226,195,107,0.4)' : '#1a0845', fontSize: '13px', fontWeight: 700, border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}
        >{saving ? 'Saving…' : 'Save Gallery'}</button>
        {msg && <p style={{ fontSize: '12px', color: msg.startsWith('✓') ? 'rgba(74,222,128,0.8)' : 'rgba(248,113,113,0.8)' }}>{msg}</p>}
      </div>
    </div>
  )
}
