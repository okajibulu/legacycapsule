// ============================================================
// FILE PATH: components/manage/display/VideoAssetLibrary.tsx
// PURPOSE:   Lists all ready video assets for the capsule.
//            Drag-to-reorder selected items using @dnd-kit
//            (already in project from EventMomentsManager).
//            Tracks selected asset IDs and their sort order.
//            Notifies parent on selection/order change.
// ARCHITECTURE: EDS / EDSVR P0 — Manage Dashboard
// BUILT BY:  AI24 · Claude Opus 4.6
// VERSION:   v2.12.25
// DATE:      20 August 2026
// ============================================================

'use client'

// ═══ SECTION 1 — Imports ═══

import { useEffect, useState, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import VideoAssetCard, { VideoAsset } from './VideoAssetCard'

// ═══ SECTION 2 — Types ═══

export interface SelectedItem {
  assetId: string
  sortOrder: number
}

interface VideoAssetLibraryProps {
  capsuleSlug: string
  capsuleId: string
  initialSelectedIds?: string[]
  onSelectionChange: (selected: SelectedItem[]) => void
  refreshTrigger?: number  // increment to force refresh
}

// ═══ SECTION 3 — Sortable Wrapper ═══

function SortableAssetCard({
  asset,
  capsuleSlug,
  selected,
  onToggle,
  onDeleted,
  onUpdated,
}: {
  asset: VideoAsset
  capsuleSlug: string
  selected: boolean
  onToggle: (id: string) => void
  onDeleted: (id: string) => void
  onUpdated: (id: string, updates: Partial<VideoAsset>) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: asset.id, disabled: !selected })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <VideoAssetCard
        asset={asset}
        capsuleSlug={capsuleSlug}
        selected={selected}
        onToggle={onToggle}
        onDeleted={onDeleted}
        onUpdated={onUpdated}
        dragHandleProps={selected ? { ...attributes, ...listeners } : undefined}
      />
    </div>
  )
}

// ═══ SECTION 4 — Main Component ═══

export default function VideoAssetLibrary({
  capsuleSlug,
  capsuleId,
  initialSelectedIds = [],
  onSelectionChange,
  refreshTrigger = 0,
}: VideoAssetLibraryProps) {
  const [assets, setAssets] = useState<VideoAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds)

  // ── 4a. Fetch all ready assets ──
  const loadAssets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch directly from Supabase via the reel GET route which includes asset data
      // Use a simple dedicated fetch here
      const res = await fetch(`/api/display/video/list?slug=${capsuleSlug}`)
      if (!res.ok) throw new Error('Failed to load videos')
      const data = await res.json()
      setAssets(data.assets || [])
    } catch {
      setError('Could not load videos. Please refresh the page.')
    }
    setLoading(false)
  }, [capsuleSlug])

  useEffect(() => {
    loadAssets()
  }, [loadAssets, refreshTrigger])

  // ── 4b. Notify parent on selection change ──
  useEffect(() => {
    const selected: SelectedItem[] = selectedIds.map((id, index) => ({
      assetId: id,
      sortOrder: index,
    }))
    onSelectionChange(selected)
  }, [selectedIds, onSelectionChange])

  // ── 4c. Toggle asset selection ──
  function handleToggle(assetId: string) {
    setSelectedIds((prev) => {
      if (prev.includes(assetId)) {
        return prev.filter((id) => id !== assetId)
      }
      return [...prev, assetId]
    })
  }

  // ── 4d. Drag to reorder ──
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setSelectedIds((prev) => {
      const oldIndex = prev.indexOf(String(active.id))
      const newIndex = prev.indexOf(String(over.id))
      if (oldIndex === -1 || newIndex === -1) return prev
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  // ── 4e. Render ──
  if (loading) {
    return <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Loading videos…</p>
  }

  if (error) {
    return <p style={{ color: '#dc2626', fontSize: '0.9rem' }}>{error}</p>
  }

  if (assets.length === 0) {
    return (
      <p style={{ color: '#9ca3af', fontSize: '0.9rem', fontStyle: 'italic' }}>
        No videos uploaded yet. Add tribute videos above to get started.
      </p>
    )
  }

  // Split: selected (in order) then unselected
  const selectedAssets = selectedIds
    .map((id) => assets.find((a) => a.id === id))
    .filter(Boolean) as VideoAsset[]

  const unselectedAssets = assets.filter((a) => !selectedIds.includes(a.id))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Selected assets — sortable */}
      {selectedAssets.length > 0 && (
        <div>
          <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0 0 0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            In Reel ({selectedAssets.length})
          </p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={selectedIds} strategy={verticalListSortingStrategy}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {selectedAssets.map((asset) => (
                  <SortableAssetCard
                    key={asset.id}
                    asset={asset}
                    capsuleSlug={capsuleSlug}
                    selected
                    onToggle={handleToggle}
                    onDeleted={(id) => setAssets(prev => prev.filter(a => a.id !== id))}
                    onUpdated={(id, updates) => setAssets(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a))}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Unselected assets */}
      {unselectedAssets.length > 0 && (
        <div>
          {selectedAssets.length > 0 && (
            <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: '0.75rem 0 0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Available ({unselectedAssets.length})
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {unselectedAssets.map((asset) => (
              <VideoAssetCard
                key={asset.id}
                asset={asset}
                capsuleSlug={capsuleSlug}
                selected={false}
                onToggle={handleToggle}
                onDeleted={(id) => setAssets(prev => prev.filter(a => a.id !== id))}
                onUpdated={(id, updates) => setAssets(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a))}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
