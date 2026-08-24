'use client';

import * as React from 'react';
import { useEffect, useRef } from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';

import { Buildings as BuildingsIcon } from '@phosphor-icons/react/dist/ssr/Buildings';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { Lock as LockIcon } from '@phosphor-icons/react/dist/ssr/Lock';
import { LockOpen as LockOpenIcon } from '@phosphor-icons/react/dist/ssr/LockOpen';
import { PaperPlaneTilt as PaperPlaneTiltIcon } from '@phosphor-icons/react/dist/ssr/PaperPlaneTilt';
import { Scales as ScalesIcon } from '@phosphor-icons/react/dist/ssr/Scales';
import { ShieldCheck as ShieldCheckIcon } from '@phosphor-icons/react/dist/ssr/ShieldCheck';
import { Tag as TagIcon } from '@phosphor-icons/react/dist/ssr/Tag';
import { X as XIcon } from '@phosphor-icons/react/dist/ssr/X';
import { useTranslation } from 'react-i18next';

import { SoftChip } from 'src/modules/knowledge/components/common/status-chip';
import { TagChips } from 'src/modules/knowledge/components/common/tag-chip';
import { UserAvatar } from 'src/modules/knowledge/components/common/user-avatar';
import { ESCALATION_SLA, PRIVACY_CLASSES } from 'src/modules/knowledge/constants';
import type { EscalationPoolItem, KnowledgeUser, Tag } from 'src/modules/knowledge/types';
import { formatDateTime } from 'src/modules/knowledge/utils/format-date';

import { SLA_TONE, useDurationText } from './duration';
import { slaLevel, waitedHours } from './sla';

/**
 * Eskalasyon cevap modalı.
 *
 * Sorular ekranındaki soru detay modalıyla aynı dili konuşur: üstte soru,
 * ortada kayıttaki diğer cevaplar, altta kompozitör. Uzman aynı işi ikinci kez
 * yapmasın diye Dasi'nin denemeleri de görünür.
 */

export interface EscalationAnswerDialogProps {
  open: boolean;
  item: EscalationPoolItem | null;
  tags: Tag[];
  users: Record<string, KnowledgeUser>;
  /** Kompozitörün içeriği — taslak ekran seviyesinde tutulur. */
  draft: string;
  nowMs: number;
  busy?: boolean;
  readOnly?: boolean;
  currentUser: KnowledgeUser | null;
  onDraftChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

const SLA_LABEL_KEY = {
  critical: 'knowledge.escalations.sla.critical',
  warning: 'knowledge.escalations.sla.warning',
  normal: 'knowledge.escalations.sla.normal'
} as const;

const SLA_HINT_KEY = {
  critical: 'knowledge.escalations.sla.criticalHint',
  warning: 'knowledge.escalations.sla.warningHint',
  normal: 'knowledge.escalations.sla.normalHint'
} as const;

export function EscalationAnswerDialog({
  open,
  item,
  tags,
  users,
  draft,
  nowMs,
  busy,
  readOnly,
  currentUser,
  onDraftChange,
  onClose,
  onSubmit
}: EscalationAnswerDialogProps): React.JSX.Element {
  const { t } = useTranslation();
  const durationText = useDurationText();
  const composerRef = useRef<HTMLInputElement | null>(null);

  // Modal soruyla açılır, kompozitöre odaklanır — kutu asla ortadan başlamaz.
  useEffect(() => {
    if (!open || readOnly) {
      return;
    }
    const timer = setTimeout(() => composerRef.current?.focus({ preventScroll: true }), 80);

    return () => clearTimeout(timer);
  }, [open, readOnly, item?.id]);

  const hours = item ? waitedHours(item, nowMs) : 0;
  const level = slaLevel(hours);
  const tone = SLA_TONE[level];
  const itemTags = item
    ? ((item.tag_id ?? []).map(id => tags.find(tag => tag.id === id)).filter(Boolean) as Tag[])
    : [];
  const privacy = PRIVACY_CLASSES.find(entry => entry.id === item?.privacy_class);
  const isCompanyScoped = item?.privacy_class === 'sirkete_ozel';

  /**
   * Dasi'nin otomatik cevabı buraya gelmez — uzmanın bakması gereken şey ya
   * başka bir uzman cevabı ya da derin araştırma çıktısı. Sonuçsuz taramalar
   * (`not_found`) cevap değil, sorunun havuza neden düştüğünün kaydı.
   */
  const otherAnswers = (item?.previous_answers ?? []).filter(answer => answer.kind !== 'otomatik' && !answer.not_found);
  const failedAttempts = (item?.previous_answers ?? []).filter(answer => answer.not_found).length;

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      onClose={onClose}
      open={open}
      scroll="paper"
    >
      <DialogTitle className="flex items-center justify-between gap-4">
        {readOnly ? t('knowledge.escalations.dialog.viewTitle') : t('knowledge.escalations.dialog.title')}
        <IconButton
          aria-label={t('knowledge.escalations.dialog.close')}
          onClick={onClose}
          size="small"
        >
          <XIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {item ? (
          <div className="flex flex-col gap-6">
            <section>
              <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
                  {t('knowledge.questions.detail.questionSection')}
                </h3>
                <Tooltip title={t(SLA_HINT_KEY[level], ESCALATION_SLA)}>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12.5px] font-medium ${tone.soft}`}
                  >
                    <ClockIcon size={14} />
                    {t(SLA_LABEL_KEY[level])}
                    <span className="opacity-80">
                      · {t('knowledge.escalations.dialog.waiting', { duration: durationText(hours) })}
                    </span>
                  </span>
                </Tooltip>
              </div>

              <div className="rounded-bubble border border-border bg-surface">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <UserAvatar name={item.asker?.name} />
                    <div>
                      <strong className="block">{item.asker?.name ?? '—'}</strong>
                      <small className="text-fg-muted">
                        {item.asker ? t(`knowledge.questions.titles.${item.asker.role}`) : ''}
                      </small>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[13px] text-fg-muted">
                    <ClockIcon />
                    {formatDateTime(item.created_at)}
                  </span>
                </div>

                <div className="px-4 py-3.5">
                  <h2 className="text-lg font-semibold leading-snug">{item.text}</h2>
                  {item.masked ? (
                    <p className="mt-2 text-[13px] text-fg-muted">{t('knowledge.privacy.maskedNote')}</p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border px-4 py-3 text-[13.5px]">
                  <span
                    className="inline-flex items-center gap-1.5 text-fg-muted"
                    title={t('knowledge.questions.detail.company')}
                  >
                    {item.company ? <BuildingsIcon /> : <ScalesIcon />}
                    {item.company?.name ?? t('knowledge.questions.generalLegislation')}
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 text-fg-muted"
                    title={t('knowledge.questions.detail.scope')}
                  >
                    {isCompanyScoped ? <LockIcon /> : <LockOpenIcon />}
                    {isCompanyScoped
                      ? t('knowledge.privacy.sirketeOzel')
                      : t('knowledge.questions.detail.scopeGeneral')}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-fg-muted">
                    <TagIcon />
                    {itemTags.length ? (
                      <TagChips
                        pool={tags}
                        tags={itemTags}
                      />
                    ) : (
                      t('knowledge.questions.detail.noTags')
                    )}
                  </span>
                  {item.privacy_class === 'kisisel_veri' && privacy ? (
                    <Tooltip title={t(privacy.descriptionKey)}>
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-warning/15 px-2 py-0.5 text-warning-strong dark:text-warning-light">
                        <ShieldCheckIcon />
                        {t(privacy.labelKey)}
                      </span>
                    </Tooltip>
                  ) : null}
                </div>
              </div>
            </section>

            {/* V41: sonuçsuz tarama bir cevap değil — sorunun havuza düşme gerekçesi. */}
            {failedAttempts ? (
              <p className="rounded-bubble border border-dashed border-border px-4 py-3 text-[13px] text-fg-muted">
                {t('knowledge.escalations.dialog.failedAttempts', { count: failedAttempts })}
              </p>
            ) : null}

            {otherAnswers.length ? (
              <section>
                <div className="mb-2.5 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
                    {t('knowledge.escalations.dialog.otherAnswers')}
                  </h3>
                  <span className="text-[13px] text-fg-muted">
                    {t('knowledge.questions.detail.recordCount', { count: otherAnswers.length })}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {otherAnswers.map(answer => (
                    <div
                      className="rounded-bubble border border-border bg-surface-1 px-4 py-3"
                      key={answer.id}
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <SoftChip
                          label={
                            answer.kind === 'uzman'
                              ? t('knowledge.escalations.dialog.expertAnswer')
                              : t('knowledge.escalations.dialog.deepResearch')
                          }
                          tone={answer.kind === 'uzman' ? 'success' : 'purple'}
                        />
                        <span className="text-[12.5px] text-fg-muted">
                          {answer.answered_by ? (users[answer.answered_by]?.name ?? '') : ''}
                        </span>
                        <span className="ml-auto text-[12.5px] text-fg-muted">{formatDateTime(answer.created_at)}</span>
                      </div>
                      <p className="whitespace-pre-wrap text-[14px] leading-relaxed">{answer.text}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section>
              {readOnly ? (
                <div className="flex flex-col items-start gap-1.5 rounded-bubble border border-dashed border-border px-4 py-4">
                  <span className="inline-flex items-center gap-2 font-semibold">
                    <LockIcon />
                    {t('knowledge.escalations.readOnly.title')}
                  </span>
                  <p className="text-[13.5px] text-fg-muted">{t('knowledge.escalations.readOnly.description')}</p>
                </div>
              ) : (
                <>
                  <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
                      {t('knowledge.escalations.composer.title')}
                    </h3>
                    <span className="text-[13px] text-fg-muted">{t('knowledge.escalations.composer.hint')}</span>
                  </div>

                  <div className="rounded-bubble border border-border bg-surface p-3.5">
                    <div className="mb-2.5 flex items-center gap-2.5">
                      <UserAvatar
                        name={currentUser?.name}
                        size={32}
                      />
                      <span className="flex min-w-0 flex-col">
                        <strong className="text-[13.5px]">
                          {currentUser?.name ?? t('knowledge.questions.answer.expertFallback')}
                        </strong>
                        <small className="text-[11.5px] text-fg-muted">
                          {t('knowledge.questions.titles.bilgi_uzmani')}
                        </small>
                      </span>
                      {draft.trim() ? (
                        <span className="ml-auto rounded bg-fg-muted/10 px-1.5 py-0.5 text-[11px] text-fg-muted">
                          {t('knowledge.escalations.card.draft')}
                        </span>
                      ) : null}
                    </div>

                    <TextField
                      fullWidth
                      inputRef={composerRef}
                      maxRows={12}
                      minRows={4}
                      multiline
                      onChange={event => onDraftChange(event.target.value)}
                      onKeyDown={event => {
                        // ⌘↵ / Ctrl+↵ ile gönder: nöbet ekranında fare yolculuğu uzun.
                        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                          event.preventDefault();
                          onSubmit();
                        }
                      }}
                      placeholder={t('knowledge.escalations.composer.placeholder')}
                      value={draft}
                    />

                    <div className="mt-2.5 flex flex-wrap items-center justify-end gap-2">
                      <span className="mr-auto text-[12px] text-fg-muted">
                        <kbd className="rounded border border-border px-1 py-0.5 text-[11px]">⌘</kbd>
                        <kbd className="ml-0.5 rounded border border-border px-1 py-0.5 text-[11px]">↵</kbd>{' '}
                        {t('knowledge.escalations.composer.shortcut')}
                      </span>
                      <Button
                        className="normal-case"
                        disabled={busy}
                        onClick={onClose}
                      >
                        {t('knowledge.escalations.composer.cancel')}
                      </Button>
                      <Button
                        className="normal-case"
                        disabled={busy || !draft.trim()}
                        onClick={onSubmit}
                        startIcon={<PaperPlaneTiltIcon />}
                        variant="contained"
                      >
                        {t('knowledge.escalations.composer.send')}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
