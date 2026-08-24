'use client';

import * as React from 'react';

import { ArrowRight as ArrowRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import { Buildings as BuildingsIcon } from '@phosphor-icons/react/dist/ssr/Buildings';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { Scales as ScalesIcon } from '@phosphor-icons/react/dist/ssr/Scales';
import { ShieldCheck as ShieldCheckIcon } from '@phosphor-icons/react/dist/ssr/ShieldCheck';
import { useTranslation } from 'react-i18next';

import { QuestionAvatar } from 'src/modules/knowledge/components/questions/question-avatar';
import { questionTagTone } from 'src/modules/knowledge/components/questions/question-ui';
import { PRIVACY_CLASSES } from 'src/modules/knowledge/constants';
import type { EscalationPoolItem, Tag } from 'src/modules/knowledge/types';
import { formatDateTime } from 'src/modules/knowledge/utils/format-date';

import { durationParts, slaLevel, waitedHours } from './sla';

/**
 * Kuyruk kartı — havuzun triyaj yüzeyi (prototip: `havuz.js → kartHTML`, V41
 * "sade enterprise" kart dili). Renk sinyaldir, yüzey değil: kart nötr kalır,
 * gecikme şeridinin tonu SLA seviyesini taşır.
 */

/** SLA seviyesi → V41 kart tonları (styles.css `body[data-sayfa="havuz"]`). */
const CARD_TONE = {
  critical: { strip: 'border-b-[#ecefeb] bg-[#fffbfa] text-[#a74c45]', em: 'text-[#8b928c]' },
  warning: { strip: 'border-b-[#ecefeb] bg-[#fffdf9] text-[#82601e]', em: 'text-[#8b928c]' },
  normal: { strip: 'border-b-[#dbe9e0] bg-[#f1f8f4] text-[#3e7256]', em: 'text-[#558068]' }
} as const;

/** Gecikme şeridindeki süre — b iri/currentColor, small küçük (prototip zaman-birim). */
function DelayDuration({ hours }: { hours: number }): React.JSX.Element {
  const { t } = useTranslation();
  const parts = durationParts(hours);

  return (
    <span className="inline-flex items-baseline gap-[5px] font-[tabular-nums]">
      {parts.map((part, index) => (
        <React.Fragment key={part.unitKey}>
          {index ? <i className="text-[9px] not-italic opacity-55">·</i> : null}
          <span className="inline-flex items-baseline gap-[2px]">
            <b className="text-[14px] font-bold leading-none">{part.value}</b>
            <small className="text-[8.5px] font-semibold opacity-80">{t(part.unitKey)}</small>
          </span>
        </React.Fragment>
      ))}
    </span>
  );
}

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

  const hours = waitedHours(item, nowMs);
  const level = slaLevel(hours);
  const tone = CARD_TONE[level];
  const itemTags = (item.tag_id ?? []).map(id => tags.find(tag => tag.id === id)).filter(Boolean) as Tag[];
  const privacy = PRIVACY_CLASSES.find(entry => entry.id === item.privacy_class);
  const isCompanyScoped = item.privacy_class === 'sirkete_ozel';

  return (
    <article
      aria-label={`${item.text} — ${readOnly ? t('knowledge.escalations.card.view') : t('knowledge.escalations.card.answer')}`}
      className="flex h-full w-full min-h-[218px] min-w-0 cursor-pointer flex-col overflow-hidden rounded-[12px] border border-[#dfe3e7] bg-white text-left shadow-[0_1px_2px_rgba(23,31,39,0.035)] transition hover:-translate-y-px hover:border-[#bac7d5] hover:shadow-[0_6px_16px_-14px_rgba(27,43,61,0.35)] focus:outline-none dark:border-border dark:bg-surface"
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
      {/* Gecikme şeridi — kartın ilk okunan satırı süre olmalı. */}
      <div className={`flex min-h-[36px] items-center gap-2 border-b px-2.5 py-[7px] ${tone.strip}`}>
        <span className="inline-flex min-w-0 items-baseline gap-[5px] whitespace-nowrap">
          <ClockIcon
            className="shrink-0 self-center"
            size={12}
          />
          <DelayDuration hours={hours} />
          <em className="text-[8px] font-[650] uppercase not-italic tracking-[0.035em]">
            {level === 'normal' ? t('knowledge.escalations.card.onTime') : t('knowledge.escalations.card.delay')}
          </em>
        </span>
        {hasDraft ? (
          <span className="ml-auto rounded border border-[#e0e4e0] bg-white px-1.5 py-[3px] text-[8px] font-[650] text-[#737b75]">
            {t('knowledge.escalations.card.draft')}
          </span>
        ) : null}
      </div>

      {/* Gövde */}
      <div className="flex flex-1 flex-col px-[13px] py-3">
        <div className="flex items-center gap-2">
          <QuestionAvatar
            name={item.asker?.name}
            size={24}
            userId={item.asker?.id}
          />
          <span className="flex min-w-0 flex-col">
            <strong className="truncate text-[11.5px] font-[650] text-[#454a45] dark:text-fg">
              {item.asker?.name ?? '—'}
            </strong>
            <small className="text-[9.5px] text-[#999e99]">
              {item.asker ? t(`knowledge.questions.titles.${item.asker.role}`) : ''}
            </small>
          </span>
        </div>

        <h3 className="mt-[9px] line-clamp-2 text-[13.5px] font-[600] leading-[1.42] text-[#2d342f] dark:text-fg">
          {item.text}
        </h3>
        {item.masked ? <p className="mt-2 text-[11px] text-[#999e99]">{t('knowledge.privacy.maskedNote')}</p> : null}

        <div className="mt-[9px] flex flex-wrap items-center gap-[5px]">
          {item.privacy_class && item.privacy_class !== 'genel' && privacy ? (
            <span
              className="inline-flex items-center gap-1 rounded border border-[#dfe2de] bg-[#f0f2ef] px-1.5 py-[2px] text-[9.2px] font-[650] text-[#687068]"
              title={t(privacy.descriptionKey)}
            >
              <ShieldCheckIcon size={10} />
              {isCompanyScoped ? t('knowledge.privacy.sirketeOzel') : t(privacy.labelKey)}
            </span>
          ) : null}
          {itemTags.slice(0, 3).map(tag => (
            <span
              className={`inline-flex items-center gap-[3px] rounded border px-1.5 py-[2px] text-[9.2px] font-[560] ${questionTagTone(tag.id, tags)}`}
              key={tag.id}
            >
              <span className="opacity-55">#</span>
              {tag.name}
            </span>
          ))}
        </div>
      </div>

      {/* Alt bilgi — şirket, tarih ve aksiyon */}
      <footer className="flex min-h-[42px] items-center gap-2.5 border-t border-[#eceeeb] bg-[#fcfcfb] px-[11px] py-[7px] text-[9.8px] text-[#858b85] dark:border-border dark:bg-surface-1">
        <span className="inline-flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
          {item.company ? (
            <BuildingsIcon
              className="shrink-0"
              size={12}
            />
          ) : (
            <ScalesIcon
              className="shrink-0"
              size={12}
            />
          )}
          <span className="truncate">{item.company?.name ?? t('knowledge.questions.generalLegislation')}</span>
        </span>
        <span className="hidden shrink-0 items-center gap-1.5 sm:inline-flex">
          <ClockIcon
            className="shrink-0"
            size={12}
          />
          {formatDateTime(item.created_at)}
        </span>
        <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-[7px] border border-[#cdd6df] bg-white px-2 py-[5px] text-[9.5px] font-bold text-[#46627f] dark:border-border dark:bg-surface">
          {readOnly ? t('knowledge.escalations.card.view') : t('knowledge.escalations.card.answer')}
          <ArrowRightIcon size={12} />
        </span>
      </footer>
    </article>
  );
}
