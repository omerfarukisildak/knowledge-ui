'use client';

import * as React from 'react';

import { useTranslation } from 'react-i18next';

import type { Tag } from 'src/modules/knowledge/types';

/**
 * Sorular ekranının rozet + etiket görünümü — prototipteki `rozet()` ve
 * `.ds-etiket` yardımcılarının birebir Tailwind karşılığı. Renk değerleri
 * `sorular.html` sayfasına özgü sıcak-nötr paletten (styles.css içindeki
 * `body[data-sayfa="sorular"]` blokları) piksel piksel alınmıştır.
 */

/** Durum → prototip rozet tonu. V43: bu ekranda yalnızca iki durum görünür. */
const STATUS_TONE: Record<string, string> = {
  eskale_edildi: 'bg-[#fff0c9] text-[#845900] border-[#efd696]',
  cozuldu: 'bg-[#ddf3e4] text-[#236d3d] border-[#bde2c8]',
  otomatik_cevaplandi: 'bg-[#dcecf8] text-[#1f5f88] border-[#bcd9ec]',
  reddedildi: 'bg-[#ffe1e2] text-[#a52f39] border-[#f4bfc3]'
};

const STATUS_NEUTRAL = 'bg-[#e8ebf1] text-[#4a5667] border-[#d2d8e2]';

export function QuestionStatusBadge({ status }: { status: string }): React.JSX.Element | null {
  const { t } = useTranslation();
  const tone = STATUS_TONE[status] ?? STATUS_NEUTRAL;
  const label = t(`knowledge.status.${status}`);

  if (!label || label === `knowledge.status.${status}`) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-md border px-2 py-[3px] text-[11.5px] font-medium ${tone}`}
    >
      {label}
    </span>
  );
}

/** Etiket palet renkleri — prototipteki `.ds-etiket-renk-0..7` (bg / text / border). */
const TAG_TONES = [
  'bg-[#dff0ff] text-[#22608d] border-[#bedcf2]',
  'bg-[#eee4ff] text-[#7142a5] border-[#d8c3f4]',
  'bg-[#dcf4e5] text-[#277145] border-[#bce3ca]',
  'bg-[#fff0cd] text-[#855d08] border-[#edd79f]',
  'bg-[#ffe2e8] text-[#a13d58] border-[#f3c0cc]',
  'bg-[#d9f4f3] text-[#216d6b] border-[#b8dfdd]',
  'bg-[#e1e7ff] text-[#4057a5] border-[#c4cff7]',
  'bg-[#ffe7d8] text-[#98512a] border-[#f1c9b0]'
] as const;

/** Etiketin havuzdaki sırasından (mod 8) türer — her yerde aynı renk. */
export function questionTagTone(tagId: string, pool: Tag[]): string {
  const index = pool.findIndex(tag => tag.id === tagId);

  return TAG_TONES[Math.max(0, index) % TAG_TONES.length];
}

export interface QuestionTagListProps {
  tags: Tag[];
  pool: Tag[];
  max?: number;
  /** Detay başlığındaki daha küçük etiketler için (`.ds-soru-ana-etiketler`). */
  compact?: boolean;
}

export function QuestionTagList({ tags, pool, max, compact }: QuestionTagListProps): React.JSX.Element {
  const shown = max ? tags.slice(0, max) : tags;
  const sizing = compact
    ? 'px-1.5 py-[2px] text-[10px] rounded-[5px]'
    : 'px-[7px] py-[3px] text-[10.5px] rounded-[7px]';

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      {shown.map(tag => (
        <span
          className={`inline-flex max-w-full items-center gap-[3px] overflow-hidden text-ellipsis whitespace-nowrap border font-semibold ${sizing} ${questionTagTone(
            tag.id,
            pool
          )}`}
          key={tag.id}
          title={tag.name}
        >
          <span className="opacity-55">#</span>
          {tag.name}
        </span>
      ))}
    </div>
  );
}
