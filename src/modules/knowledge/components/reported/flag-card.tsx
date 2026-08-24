'use client';

import * as React from 'react';

import Button from '@mui/material/Button';

import { ArrowSquareOut as ArrowSquareOutIcon } from '@phosphor-icons/react/dist/ssr/ArrowSquareOut';
import { BookOpen as BookOpenIcon } from '@phosphor-icons/react/dist/ssr/BookOpen';
import { Check as CheckIcon } from '@phosphor-icons/react/dist/ssr/Check';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { Eye as EyeIcon } from '@phosphor-icons/react/dist/ssr/Eye';
import { File as FileIcon } from '@phosphor-icons/react/dist/ssr/File';
import { Flag as FlagIcon } from '@phosphor-icons/react/dist/ssr/Flag';
import { Lock as LockIcon } from '@phosphor-icons/react/dist/ssr/Lock';
import { MagnifyingGlass as MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { PencilSimple as PencilSimpleIcon } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import { Question as QuestionIcon } from '@phosphor-icons/react/dist/ssr/Question';
import { SealCheck as SealCheckIcon } from '@phosphor-icons/react/dist/ssr/SealCheck';
import { ShieldCheck as ShieldCheckIcon } from '@phosphor-icons/react/dist/ssr/ShieldCheck';
import { X as XIcon } from '@phosphor-icons/react/dist/ssr/X';
import { useTranslation } from 'react-i18next';

import { UserAvatar } from 'src/modules/knowledge/components/common/user-avatar';
import type { FlagListItem, KnowledgeUser } from 'src/modules/knowledge/types';
import { formatRelative } from 'src/modules/knowledge/utils/format-date';

import { type FlagOutcome, type FlagStatus, OUTCOME_TONE, STATUS_TONE, TARGET_META, safeSourceUrl } from './flag-meta';

/**
 * Rapor kartı — prototipin `satir()` fonksiyonunun karşılığı.
 *
 * Kart tek bir soruya cevap verir: bu rapor hangi aşamada ve sıradaki adım ne?
 * Aksiyonlar aşamaya göre değişir (PRD §4.8): Açık'ta tek seçenek incelemeye
 * almak, İnceleniyor'da karar vermek, Kapandı'da yalnızca okumak.
 */

const TARGET_ICONS = { book: BookOpenIcon, file: FileIcon, question: QuestionIcon } as const;

export interface FlagCardProps {
  flag: FlagListItem;
  /** Admin raporları izler ama karar veremez (RACI). */
  readOnly?: boolean;
  busy?: boolean;
  onViewContent: () => void;
  onStartReview: () => void;
  onUpdate: () => void;
  onNoChange: () => void;
}

function PersonLine({ user, caption }: { user: KnowledgeUser | null; caption: string }): React.JSX.Element {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <UserAvatar
        name={user?.name}
        size={26}
      />
      <span className="flex min-w-0 flex-col leading-tight">
        <strong className="truncate text-[12.5px]">{user?.name ?? '—'}</strong>
        <small className="truncate text-[11px] text-fg-muted">{caption}</small>
      </span>
    </span>
  );
}

export function FlagCard({
  flag,
  readOnly,
  busy,
  onViewContent,
  onStartReview,
  onUpdate,
  onNoChange
}: FlagCardProps): React.JSX.Element {
  const { t } = useTranslation();

  const status = flag.status as FlagStatus;
  const outcome = flag.outcome as FlagOutcome | undefined;
  const target = TARGET_META[flag.target_kind];
  const TargetIcon = TARGET_ICONS[target.icon];
  const replySource = safeSourceUrl(flag.reply_source?.url);
  const roleCaption = (user: KnowledgeUser | null, suffix: string) =>
    `${user ? t(`knowledge.questions.titles.${user.role}`) : ''} · ${suffix}`;

  return (
    <article
      className={`overflow-hidden rounded-bubble border bg-surface shadow-card ${
        flag.priority ? 'border-warning/45' : 'border-border'
      }`}
    >
      <header className="flex flex-wrap items-start gap-3 border-b border-border px-4 py-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-fg-muted/10 text-fg-muted">
          <TargetIcon size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
            {t(target.labelKey)}
          </span>
          <h3 className="mt-0.5 text-[15px] font-semibold leading-snug">{flag.target_title}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {flag.priority ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-warning/15 px-1.5 py-0.5 text-[11px] font-medium text-warning-strong dark:text-warning-light">
              <ShieldCheckIcon size={12} />
              {t('knowledge.reported.priority')}
            </span>
          ) : null}
          <span className={`rounded-md px-2 py-0.5 text-[11.5px] font-medium ${STATUS_TONE[status]}`}>
            {t(`knowledge.reported.status.${status}`)}
          </span>
          {status === 'kapandi' && outcome ? (
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11.5px] font-medium ${OUTCOME_TONE[outcome]}`}
            >
              {outcome === 'guncellendi' ? <SealCheckIcon size={12} /> : <CheckIcon size={12} />}
              {t(`knowledge.reported.outcome.${outcome}`)}
            </span>
          ) : null}
        </div>
      </header>

      <div className="flex gap-2.5 px-4 py-3">
        <span className="mt-0.5 shrink-0 text-warning-strong dark:text-warning-light">
          <FlagIcon size={15} />
        </span>
        <div className="min-w-0">
          <small className="block text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
            {t('knowledge.reported.reasonLabel')}
          </small>
          <p className="mt-0.5 text-[14px] leading-relaxed">{flag.reason}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border px-4 py-2.5">
        <PersonLine
          caption={roleCaption(flag.reporter, t('knowledge.reported.reporter'))}
          user={flag.reporter}
        />
        <span className="inline-flex items-center gap-1.5 text-[12.5px] text-fg-muted">
          <ClockIcon size={13} />
          {formatRelative(flag.date)}
        </span>
        {status === 'inceleniyor' && flag.updater ? (
          <PersonLine
            caption={roleCaption(flag.updater, t('knowledge.reported.reviewing'))}
            user={flag.updater}
          />
        ) : null}
      </div>

      {/* Kapanış çıktısı: güncellenen bilgi, uzman yanıtı veya yalnızca not. */}
      {outcome === 'guncellendi' && flag.target_kind === 'kb_kaydi' && flag.target ? (
        <section className="border-t border-border bg-success/5 px-4 py-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <PersonLine
              caption={roleCaption(flag.updater, t('knowledge.reported.updated'))}
              user={flag.updater}
            />
            <span className="inline-flex items-center gap-1 text-[12px] font-medium text-success-strong dark:text-success-light">
              <SealCheckIcon size={13} />
              {t('knowledge.reported.updatedInfo')}
            </span>
          </div>
          <h4 className="text-[13.5px] font-semibold">{flag.target.title}</h4>
          <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-[13px] leading-relaxed text-fg-muted">
            {flag.target.body}
          </p>
          {flag.description ? (
            <footer className="mt-2 border-t border-border pt-2">
              <small className="block text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                {t('knowledge.reported.expertNote')}
              </small>
              <p className="mt-0.5 text-[13px]">{flag.description}</p>
            </footer>
          ) : null}
        </section>
      ) : flag.expert_reply ? (
        <section className="border-t border-border bg-info/5 px-4 py-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <PersonLine
              caption={roleCaption(flag.replier ?? flag.updater, t('knowledge.reported.replied'))}
              user={flag.replier ?? flag.updater}
            />
            <span className="inline-flex items-center gap-1 text-[12px] font-medium text-info-strong dark:text-info-light">
              <SealCheckIcon size={13} />
              {t('knowledge.reported.expertReply')}
            </span>
          </div>
          <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed">{flag.expert_reply}</p>
          {replySource ? (
            <a
              className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] text-primary-strong no-underline hover:underline dark:text-primary-light"
              href={replySource}
              rel="noopener noreferrer"
              target="_blank"
            >
              <ArrowSquareOutIcon size={13} />
              {flag.reply_source?.title ?? t('knowledge.reported.sourceFallback')}
            </a>
          ) : null}
        </section>
      ) : flag.description ? (
        <section className="border-t border-border px-4 py-3">
          <small className="block text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
            {t('knowledge.reported.expertNote')}
          </small>
          <p className="mt-0.5 text-[13.5px]">{flag.description}</p>
        </section>
      ) : null}

      <footer className="flex flex-wrap items-center gap-2 border-t border-border bg-surface-1 px-4 py-2.5">
        <Button
          className="normal-case"
          onClick={onViewContent}
          size="small"
          startIcon={<EyeIcon />}
          variant="outlined"
        >
          {t('knowledge.reported.viewContent')}
        </Button>

        {readOnly ? (
          <span className="ml-auto inline-flex items-center gap-1.5 text-[12.5px] text-fg-muted">
            <LockIcon size={13} />
            {t('knowledge.reported.readOnlyChip')}
          </span>
        ) : (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {status === 'acik' ? (
              <Button
                className="normal-case"
                disabled={busy}
                onClick={onStartReview}
                size="small"
                startIcon={<MagnifyingGlassIcon />}
                variant="contained"
              >
                {t('knowledge.reported.startReview')}
              </Button>
            ) : null}
            {status === 'inceleniyor' ? (
              <>
                <Button
                  className="normal-case"
                  disabled={busy}
                  onClick={onUpdate}
                  size="small"
                  startIcon={<PencilSimpleIcon />}
                  variant="contained"
                >
                  {t('knowledge.reported.updateInfo')}
                </Button>
                <Button
                  className="normal-case"
                  color="inherit"
                  disabled={busy}
                  onClick={onNoChange}
                  size="small"
                  startIcon={<XIcon />}
                  variant="outlined"
                >
                  {t('knowledge.reported.noChange')}
                </Button>
              </>
            ) : null}
          </div>
        )}
      </footer>
    </article>
  );
}
