'use client';

import * as React from 'react';
import { useEffect } from 'react';

import { Buildings as BuildingsIcon } from '@phosphor-icons/react/dist/ssr/Buildings';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { Lock as LockIcon } from '@phosphor-icons/react/dist/ssr/Lock';
import { LockOpen as LockOpenIcon } from '@phosphor-icons/react/dist/ssr/LockOpen';
import { ShieldCheck as ShieldCheckIcon } from '@phosphor-icons/react/dist/ssr/ShieldCheck';
import { Tag as TagIcon } from '@phosphor-icons/react/dist/ssr/Tag';
import { useTranslation } from 'react-i18next';

import { PRIVACY_CLASSES } from 'src/modules/knowledge/constants';
import type { Company, KnowledgeUser, QuestionDetail, Tag } from 'src/modules/knowledge/types';
import { formatDateTime } from 'src/modules/knowledge/utils/format-date';

import { ExpertAnswerCard } from './expert-answer-card';
import { QuestionAvatar } from './question-avatar';
import { QuestionStatusBadge, QuestionTagList } from './question-ui';

/**
 * Soru detayı — prototipin `soruDetayAc()` modalının birebir karşılığı
 * (`.ds-soru-detay-modal`). MUI Dialog yerine düz overlay + Tailwind.
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

/** Meta satırındaki ayraç — prototipteki `.ds-soru-ana-bilgi + ::before`. */
function MetaDivider(): React.JSX.Element {
  return <span className="h-[18px] w-px bg-[#e7e7e5] dark:bg-border" />;
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
}: QuestionDetailDialogProps): React.JSX.Element | null {
  const { t } = useTranslation();

  // Escape ile kapat + arka planı kaydırmaya kilitle.
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open || !question) {
    return null;
  }

  const company = companies.find(entry => entry.id === question.company_id);
  const asker = users[question.asker_id];
  const questionTags = (question.tag_id ?? []).map(id => tags.find(tag => tag.id === id)).filter(Boolean) as Tag[];
  const privacy = PRIVACY_CLASSES.find(entry => entry.id === question.privacy_class);
  const isCompanyScoped = question.privacy_class === 'sirkete_ozel';
  const expertAnswers = (question.answers ?? []).filter(answer => answer.kind === 'uzman');

  return (
    <div
      aria-modal="true"
      className="kb-surface fixed inset-0 z-50 grid place-items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-6"
      onClick={onClose}
      role="dialog"
    >
      <div
        className="my-auto w-full max-w-[860px] overflow-hidden rounded-[18px] bg-white shadow-[0_24px_60px_rgba(11,16,32,0.24)] dark:bg-surface"
        onClick={event => event.stopPropagation()}
      >
        {/* Sabit başlık */}
        <div className="sticky top-0 z-[5] flex items-center justify-between gap-4 border-b border-[#e7e7e5] bg-white/95 px-[22px] py-3 backdrop-blur dark:border-border dark:bg-surface/95">
          <h3 className="text-[16px] font-[650] text-[#171816] dark:text-fg">
            {t('knowledge.questions.detail.title')}
          </h3>
          <button
            aria-label={t('knowledge.questions.detail.title')}
            className="grid h-9 w-9 place-items-center rounded-full border border-transparent bg-transparent text-[20px] leading-none text-[#696b67] transition hover:border-[#e7e7e5] hover:bg-[#f7f7f5] focus:outline-none dark:text-fg-muted dark:hover:border-border dark:hover:bg-surface-1"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        {/* Soru bölümü */}
        <section className="px-6 pb-6 pt-2">
          <div className="mb-3">
            <h3 className="text-[15px] font-[650] text-[#171816] dark:text-fg">
              {t('knowledge.questions.detail.questionSection')}
            </h3>
          </div>

          <div className="overflow-hidden rounded-[14px] border border-[#e7e7e5] bg-white shadow-[0_3px_12px_rgba(11,16,32,0.04)] dark:border-border dark:bg-surface">
            <div className="flex min-h-[68px] flex-wrap items-center justify-between gap-4 border-b border-[#eeeeec] bg-[#fbfbfc] px-4 py-3 dark:border-border dark:bg-surface-1">
              <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                <QuestionAvatar
                  name={asker?.name}
                  size={42}
                  userId={question.asker_id}
                />
                <span className="flex min-w-0 flex-col leading-[1.2]">
                  <strong className="text-[13px] font-[650] text-[#171816] dark:text-fg">{asker?.name ?? '—'}</strong>
                  <small className="mt-[3px] block text-[10.5px] text-[#979994]">
                    {asker ? t(`knowledge.questions.titles.${asker.role}`) : ''}
                  </small>
                </span>
                <span className="ml-1">
                  <QuestionStatusBadge status={question.status} />
                </span>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 text-[11.5px] text-[#979994]">
                <ClockIcon size={13} />
                {formatDateTime(question.created_at)}
              </span>
            </div>

            <div className="px-[17px] pb-5 pt-[18px]">
              <h2 className="max-w-[740px] whitespace-pre-wrap text-[16px] font-normal leading-[1.65] text-[#171816] dark:text-fg">
                {question.text}
              </h2>
              {question.masked ? (
                <p className="mt-2 text-[13px] text-[#979994]">{t('knowledge.privacy.maskedNote')}</p>
              ) : null}
            </div>

            <div className="flex min-h-[48px] flex-wrap items-center gap-x-[18px] gap-y-2 border-t border-[#eeeeec] bg-[#fcfcfd] px-4 py-[9px] text-[12px] dark:border-border dark:bg-surface-1">
              <span
                className="inline-flex min-w-0 items-center gap-1.5 text-[#68719d]"
                title={t('knowledge.questions.detail.company')}
              >
                <BuildingsIcon
                  className="shrink-0"
                  size={14}
                />
                {/* Şirket sayfası henüz taşınmadı; name düz text olarak duruyor. */}
                <span className="truncate">
                  {company ? company.name : t('knowledge.questions.detail.companyMissing')}
                </span>
              </span>

              <MetaDivider />
              <span
                className="inline-flex items-center gap-1.5 text-[#68719d]"
                title={t('knowledge.questions.detail.scope')}
              >
                {isCompanyScoped ? <LockIcon size={14} /> : <LockOpenIcon size={14} />}
                {isCompanyScoped ? t('knowledge.privacy.sirketeOzel') : t('knowledge.questions.detail.scopeGeneral')}
              </span>

              <MetaDivider />
              <span className="inline-flex min-w-0 items-center gap-1.5 text-[#68719d]">
                <TagIcon
                  className="shrink-0"
                  size={14}
                />
                {questionTags.length ? (
                  <QuestionTagList
                    compact
                    pool={tags}
                    tags={questionTags}
                  />
                ) : (
                  t('knowledge.questions.detail.noTags')
                )}
              </span>

              {question.privacy_class === 'kisisel_veri' && privacy ? (
                <>
                  <MetaDivider />
                  <span
                    className="inline-flex items-center gap-1.5 text-[10.5px] font-medium text-[#8b93b5]"
                    title={t(privacy.descriptionKey)}
                  >
                    <ShieldCheckIcon size={13} />
                    {t(privacy.labelKey)}
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </section>

        {/* Cevaplar bölümü */}
        <section className="border-t border-[#e7e7e5] px-6 pb-6 pt-2 dark:border-border">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-[15px] font-[650] text-[#171816] dark:text-fg">
              {t('knowledge.questions.detail.answerSection')}
            </h3>
            <span className="text-[12px] text-[#979994]">
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
              <div className="rounded-xl border border-[#cfe0fc] bg-[#e8f2fe] px-4 py-3 text-[14px] text-[#12448f]">
                {t('knowledge.questions.detail.poolNotice')}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
