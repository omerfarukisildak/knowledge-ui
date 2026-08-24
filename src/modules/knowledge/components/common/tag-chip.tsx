'use client';

import * as React from 'react';

import Chip from '@mui/material/Chip';

import type { Tag } from 'src/modules/knowledge/types';

/**
 * Etiket çipi. Renk, etiketin havuzdaki SIRASINDAN türetilir (mod 8) — böylece
 * bir etiket uygulamanın her yerinde aynı renkte görünür.
 *
 * Sınıflar tam string olarak bu dizide duruyor; `bg-tag-${i}` gibi kurulan
 * dinamik adları Tailwind derleme sırasında göremez ve stilleri üretmez.
 * Renk değerleri `global.css` içindeki knowledge token'larından gelir, koyu tema
 * karşılıkları da orada.
 */
const TAG_CLASSES = [
  'bg-[var(--kb-tag-0-bg)] text-[var(--kb-tag-0-fg)] border-[var(--kb-tag-0-br)]',
  'bg-[var(--kb-tag-1-bg)] text-[var(--kb-tag-1-fg)] border-[var(--kb-tag-1-br)]',
  'bg-[var(--kb-tag-2-bg)] text-[var(--kb-tag-2-fg)] border-[var(--kb-tag-2-br)]',
  'bg-[var(--kb-tag-3-bg)] text-[var(--kb-tag-3-fg)] border-[var(--kb-tag-3-br)]',
  'bg-[var(--kb-tag-4-bg)] text-[var(--kb-tag-4-fg)] border-[var(--kb-tag-4-br)]',
  'bg-[var(--kb-tag-5-bg)] text-[var(--kb-tag-5-fg)] border-[var(--kb-tag-5-br)]',
  'bg-[var(--kb-tag-6-bg)] text-[var(--kb-tag-6-fg)] border-[var(--kb-tag-6-br)]',
  'bg-[var(--kb-tag-7-bg)] text-[var(--kb-tag-7-fg)] border-[var(--kb-tag-7-br)]'
] as const;

export function tagPaletteIndex(tagId: string, pool: Tag[]): number {
  const index = pool.findIndex(tag => tag.id === tagId);

  return Math.max(0, index) % TAG_CLASSES.length;
}

export interface TagChipProps {
  tag: Tag;
  /** Renk sırasını belirleyen havuz; verilmezse ilk renk kullanılır. */
  pool?: Tag[];
  selected?: boolean;
  onClick?: () => void;
  size?: 'small' | 'medium';
}

export function TagChip({ tag, pool = [], selected, onClick, size = 'small' }: TagChipProps): React.JSX.Element {
  const colorClasses = TAG_CLASSES[tagPaletteIndex(tag.id, pool)];

  return (
    <Chip
      className={[
        'rounded-md border text-[12.5px] font-medium',
        colorClasses,
        selected ? '!border-primary ring-2 ring-primary/25' : ''
      ]
        .filter(Boolean)
        .join(' ')}
      clickable={Boolean(onClick)}
      label={`# ${tag.name}`}
      onClick={onClick}
      size={size}
    />
  );
}

export function TagChips({ tags, pool = [], max }: { tags: Tag[]; pool?: Tag[]; max?: number }): React.JSX.Element {
  const shown = max ? tags.slice(0, max) : tags;

  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map(tag => (
        <TagChip
          key={tag.id}
          pool={pool}
          tag={tag}
        />
      ))}
    </div>
  );
}
