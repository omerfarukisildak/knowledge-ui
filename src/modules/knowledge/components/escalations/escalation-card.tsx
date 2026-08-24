'use client';

import * as React from 'react';

import Tooltip from '@mui/material/Tooltip';

import { ArrowRight as ArrowRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import { Buildings as BuildingsIcon } from '@phosphor-icons/react/dist/ssr/Buildings';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { Scales as ScalesIcon } from '@phosphor-icons/react/dist/ssr/Scales';
import { ShieldCheck as ShieldCheckIcon } from '@phosphor-icons/react/dist/ssr/ShieldCheck';
import { useTranslation } from 'react-i18next';

import { TagChips } from 'src/modules/knowledge/components/common/tag-chip';
import { UserAvatar } from 'src/modules/knowledge/components/common/user-avatar';
import { PRIVACY_CLASSES } from 'src/modules/knowledge/constants';
import type { EscalationPoolItem, Tag } from 'src/modules/knowledge/types';
import { formatDateTime } from 'src/modules/knowledge/utils/format-date';

import { Duration, SLA_TONE, useDurationText } from './duration';
import { slaLevel, waitedHours } from './sla';

/**
 * Kuyruk kartı — havuzun triyaj yüzeyi.
 *
 * Kart yalnızca "bunu ben mi alsam" kararını verdirir: kim sordu, ne sordu, ne
 * zamandır bekliyor, hangi şirket. Cevaplama kartta değil modalda yapılır.
 */

export interface EscalationCardProps {
  item: EscalationPoolItem;
  tags: Tag[];
  nowMs: number;
  /** Admin kuyruğu izler ama cevap yazamaz (RACI). */
  readOnly?: boolean;
  /** Bu kayıtta kaydedilmiş bir cevap taslağı var mı. */
  hasDraft?: boolean;
  onOpen: () => void;
}

export function EscalationCard({
  item,
  tags,
  nowMs,
  readOnly,
  hasDraft,
  onOpen
}: EscalationCardProps): React.JSX.Element {
  const { t } = useTranslation();
  const durationText = useDurationText();

  const hours = waitedHours(item, nowMs);
  const level = slaLevel(hours);
  const tone = SLA_TONE[level];
  const itemTags = (item.tag_id ?? []).map(id => tags.find(tag => tag.id === id)).filter(Boolean) as Tag[];
  const privacy = PRIVACY_CLASSES.find(entry => entry.id === item.privacy_class);

  return (
    <article
      aria-label={`${item.text} — ${readOnly ? t('knowledge.escalations.card.view') : t('knowledge.escalations.card.answer')}`}
      className={`flex min-w-0 cursor-pointer flex-col overflow-hidden rounded-bubble border bg-surface text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-lifted ${tone.card}`}
      onClick={onOpen}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
      role="button"
      tabIndex={0}
    >
      {/* Gecikme şeridi: kartın ilk okunan satırı süre olmalı. */}
      <div className={`flex items-center justify-between gap-3 px-4 py-2 ${tone.soft}`}>
        <span className="inline-flex items-center gap-1.5 text-[13px]">
          <ClockIcon size={14} />
          <Duration hours={hours} />
          <em className="not-italic text-[12px] opacity-80">
            {level === 'normal' ? t('knowledge.escalations.card.onTime') : t('knowledge.escalations.card.delay')}
          </em>
        </span>
        {hasDraft ? (
          <span className="rounded bg-surface/70 px-1.5 py-0.5 text-[11px] font-medium">
            {t('knowledge.escalations.card.draft')}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <UserAvatar
            name={item.asker?.name}
            size={30}
          />
          <span className="flex min-w-0 flex-col">
            <strong className="truncate text-[13.5px]">{item.asker?.name ?? '—'}</strong>
            <small className="text-[11.5px] text-fg-muted">
              {item.asker ? t(`knowledge.questions.titles.${item.asker.role}`) : ''}
            </small>
          </span>
        </div>

        <h3 className="text-[15px] font-semibold leading-snug">{item.text}</h3>
        {item.masked ? <p className="text-[12.5px] text-fg-muted">{t('knowledge.privacy.maskedNote')}</p> : null}

        <div className="mt-auto flex flex-wrap items-center gap-1.5">
          {item.privacy_class === 'kisisel_veri' && privacy ? (
            <Tooltip title={t(privacy.descriptionKey)}>
              <span className="inline-flex items-center gap-1 rounded-md bg-warning/15 px-1.5 py-0.5 text-[11px] text-warning-strong dark:text-warning-light">
                <ShieldCheckIcon size={12} />
                {t(privacy.labelKey)}
              </span>
            </Tooltip>
          ) : null}
          <TagChips
            max={3}
            pool={tags}
            tags={itemTags}
          />
        </div>
      </div>

      <footer className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border px-4 py-2.5 text-[12.5px] text-fg-muted">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          {item.company ? <BuildingsIcon size={13} /> : <ScalesIcon size={13} />}
          <span className="truncate">{item.company?.name ?? t('knowledge.questions.generalLegislation')}</span>
        </span>
        <span
          className="inline-flex items-center gap-1.5"
          title={durationText(hours)}
        >
          <ClockIcon size={13} />
          {formatDateTime(item.created_at)}
        </span>
        <span className={`ml-auto inline-flex items-center gap-1 font-medium ${tone.text}`}>
          {readOnly ? t('knowledge.escalations.card.view') : t('knowledge.escalations.card.answer')}
          <ArrowRightIcon size={13} />
        </span>
      </footer>
    </article>
  );
}
