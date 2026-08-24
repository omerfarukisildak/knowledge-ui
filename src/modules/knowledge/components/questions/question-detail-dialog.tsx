'use client';

import * as React from 'react';

import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import { Buildings as BuildingsIcon } from '@phosphor-icons/react/dist/ssr/Buildings';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { Lock as LockIcon } from '@phosphor-icons/react/dist/ssr/Lock';
import { LockOpen as LockOpenIcon } from '@phosphor-icons/react/dist/ssr/LockOpen';
import { ShieldCheck as ShieldCheckIcon } from '@phosphor-icons/react/dist/ssr/ShieldCheck';
import { Tag as TagIcon } from '@phosphor-icons/react/dist/ssr/Tag';
import { X as XIcon } from '@phosphor-icons/react/dist/ssr/X';
import { useTranslation } from 'react-i18next';

import { StatusChip } from 'src/modules/knowledge/components/common/status-chip';
import { TagChips } from 'src/modules/knowledge/components/common/tag-chip';
import { UserAvatar } from 'src/modules/knowledge/components/common/user-avatar';
import { PRIVACY_CLASSES } from 'src/modules/knowledge/constants';
import type { Company, KnowledgeUser, QuestionDetail, Tag } from 'src/modules/knowledge/types';
import { formatDateTime } from 'src/modules/knowledge/utils/format-date';

import { ExpertAnswerCard } from './expert-answer-card';

/**
 * Soru detayı. Prototipin `soruDetayAc()` modalının karşılığı.
 *
 * V43: yalnızca Bilgi Uzmanı cevapları listelenir. Dasi'nin otomatik cevabı,
 * derin araştırma çıktısı ve sonuçsuz taraması bu ekrana girmez.
 */

export interface QuestionDetailDialogProps {
  open: boolean;
  question: QuestionDetail | null;
  companies: Company[];
  tags: Tag[];
  users: Record<string, KnowledgeUser>;
  busy?: boolean;
  onClose: () => void;
  onFeedback: (answerId: string, value: 'onay' | 'red') => void;
  onReport: (answerId: string) => void;
}

export function QuestionDetailDialog({
  open,
  question,
  companies,
  tags,
  users,
  busy,
  onClose,
  onFeedback,
  onReport
}: QuestionDetailDialogProps): React.JSX.Element {
  const { t } = useTranslation();

  const company = question ? companies.find(entry => entry.id === question.company_id) : null;
  const asker = question ? users[question.asker_id] : null;
  const questionTags = question
    ? ((question.tag_id ?? []).map(id => tags.find(tag => tag.id === id)).filter(Boolean) as Tag[])
    : [];
  const privacy = PRIVACY_CLASSES.find(entry => entry.id === question?.privacy_class);
  const isCompanyScoped = question?.privacy_class === 'sirkete_ozel';
  const expertAnswers = (question?.answers ?? []).filter(answer => answer.kind === 'uzman');

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      onClose={onClose}
      open={open}
      scroll="paper"
    >
      <DialogTitle className="flex items-center justify-between gap-4">
        {t('knowledge.questions.detail.title')}
        <IconButton
          aria-label={t('knowledge.questions.detail.title')}
          onClick={onClose}
          size="small"
        >
          <XIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {question ? (
          <div className="flex flex-col gap-6">
            <section>
              <h3 className="mb-2.5 text-sm font-semibold uppercase tracking-wide text-fg-muted">
                {t('knowledge.questions.detail.questionSection')}
              </h3>
              <div className="rounded-bubble border border-border bg-surface">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <UserAvatar name={asker?.name} />
                    <div>
                      <strong className="block">{asker?.name ?? '—'}</strong>
                      <small className="text-fg-muted">
                        {asker ? t(`knowledge.questions.titles.${asker.role}`) : ''}
                      </small>
                    </div>
                    <StatusChip status={question.status} />
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[13px] text-fg-muted">
                    <ClockIcon />
                    {formatDateTime(question.created_at)}
                  </span>
                </div>

                <div className="px-4 py-3.5">
                  <h2 className="text-lg font-semibold leading-snug">{question.text}</h2>
                  {question.masked ? (
                    <p className="mt-2 text-[13px] text-fg-muted">{t('knowledge.privacy.maskedNote')}</p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border px-4 py-3 text-[13.5px]">
                  <span
                    className="inline-flex items-center gap-1.5 text-fg-muted"
                    title={t('knowledge.questions.detail.company')}
                  >
                    <BuildingsIcon />
                    {/* Şirket sayfası henüz taşınmadı; name düz text olarak duruyor. */}
                    {company ? company.name : t('knowledge.questions.detail.companyMissing')}
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
                    {questionTags.length ? (
                      <TagChips
                        pool={tags}
                        tags={questionTags}
                      />
                    ) : (
                      t('knowledge.questions.detail.noTags')
                    )}
                  </span>
                  {question.privacy_class === 'kisisel_veri' && privacy ? (
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

            <section>
              <div className="mb-2.5 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
                  {t('knowledge.questions.detail.answerSection')}
                </h3>
                <span className="text-[13px] text-fg-muted">
                  {expertAnswers.length
                    ? t('knowledge.questions.detail.recordCount', { count: expertAnswers.length })
                    : t('knowledge.questions.detail.noAnswerYet')}
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {expertAnswers.map(answer => (
                  <ExpertAnswerCard
                    answer={answer}
                    author={answer.answered_by ? (users[answer.answered_by] ?? null) : null}
                    disabled={busy}
                    key={answer.id}
                    onFeedback={value => onFeedback(answer.id, value)}
                    onReport={() => onReport(answer.id)}
                    question={question}
                  />
                ))}

                {question.status === 'eskale_edildi' ? (
                  <Alert severity="info">{t('knowledge.questions.detail.poolNotice')}</Alert>
                ) : null}
              </div>
            </section>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
