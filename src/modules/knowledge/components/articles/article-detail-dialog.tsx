'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';

import { ArrowSquareOut as ArrowSquareOutIcon } from '@phosphor-icons/react/dist/ssr/ArrowSquareOut';
import { BookOpen as BookOpenIcon } from '@phosphor-icons/react/dist/ssr/BookOpen';
import { CaretDown as CaretDownIcon } from '@phosphor-icons/react/dist/ssr/CaretDown';
import { Check as CheckIcon } from '@phosphor-icons/react/dist/ssr/Check';
import { Flag as FlagIcon } from '@phosphor-icons/react/dist/ssr/Flag';
import { LinkSimple as LinkSimpleIcon } from '@phosphor-icons/react/dist/ssr/LinkSimple';
import { Lock as LockIcon } from '@phosphor-icons/react/dist/ssr/Lock';
import { LockOpen as LockOpenIcon } from '@phosphor-icons/react/dist/ssr/LockOpen';
import { PencilSimple as PencilSimpleIcon } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import { Tag as TagIcon } from '@phosphor-icons/react/dist/ssr/Tag';
import { ThumbsDown as ThumbsDownIcon } from '@phosphor-icons/react/dist/ssr/ThumbsDown';
import { ThumbsUp as ThumbsUpIcon } from '@phosphor-icons/react/dist/ssr/ThumbsUp';
import { X as XIcon } from '@phosphor-icons/react/dist/ssr/X';
import { useTranslation } from 'react-i18next';

import { TagChips } from 'src/modules/knowledge/components/common/tag-chip';
import type { ArticleListItem, FeedbackSummary, Tag } from 'src/modules/knowledge/types';
import { formatDate, formatDateTime } from 'src/modules/knowledge/utils/format-date';

/**
 * Bilgi kaydı detayı — prototipin `detayAc()` modalının karşılığı.
 *
 * V44: onay kademesi yok, her kayıt yayında. Bu yüzden modalde "durum" değil
 * KAYNAK öne çıkıyor (05 §3 kaynağa dayalılık): kaynağı olmayan kayıt bunu
 * dürüstçe söyler, kaynak varmış gibi gösterilmez.
 */

export interface ArticleDetailDialogProps {
  open: boolean;
  article: ArticleListItem | null;
  tags: Tag[];
  feedback: FeedbackSummary | null;
  busy?: boolean;
  /** Düzenleme yetkisi yalnızca Bilgi Uzmanı Havuzu'nda (RACI). */
  canEdit?: boolean;
  /** Operasyon rolü kaydı salt görüntüler. */
  readOnly?: boolean;
  onClose: () => void;
  onFeedback: (value: 'onay' | 'red') => void;
  onReport: () => void;
  onEdit: () => void;
}

export function ArticleDetailDialog({
  open,
  article,
  tags,
  feedback,
  busy,
  canEdit,
  readOnly,
  onClose,
  onFeedback,
  onReport,
  onEdit
}: ArticleDetailDialogProps): React.JSX.Element {
  const { t } = useTranslation();
  const [historyOpen, setHistoryOpen] = useState(false);

  // Her kayıt kendi geçmişiyle açılır; önceki kaydın açık paneli taşınmaz.
  useEffect(() => {
    setHistoryOpen(false);
  }, [article?.id, open]);

  const source = article?.source_legislation ?? null;
  const history = article?.version_history ?? [];
  const articleTags = article?.tags ?? [];

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      onClose={onClose}
      open={open}
      scroll="paper"
    >
      <DialogTitle className="flex items-center justify-between gap-4">
        {t('knowledge.articles.detail.title')}
        <IconButton
          aria-label={t('knowledge.articles.detail.close')}
          onClick={onClose}
          size="small"
        >
          <XIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {article ? (
          <div className="flex flex-col gap-6">
            <section>
              <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
                  {t('knowledge.articles.detail.recordSection')}
                </h3>
                <span className="text-[12px] uppercase text-fg-muted">{article.id}</span>
              </div>

              <article className="rounded-bubble border border-border bg-surface">
                <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
                  <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-primary/15 text-primary-strong dark:text-primary-light">
                    <BookOpenIcon size={17} />
                  </span>
                  <span className="flex min-w-0 flex-col leading-tight">
                    <strong className="text-[13.5px]">{t('knowledge.articles.detail.recordKind')}</strong>
                    <small className="text-[11.5px] text-fg-muted">{t('knowledge.articles.detail.recordOwner')}</small>
                  </span>
                </div>

                <div className="px-4 py-3.5">
                  <h2 className="text-lg font-semibold leading-snug">{article.title}</h2>
                  <div className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed">{article.content}</div>
                  {article.masked ? (
                    <p className="mt-2 text-[13px] text-fg-muted">{t('knowledge.privacy.maskedNote')}</p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border px-4 py-3 text-[13.5px]">
                  <span className="inline-flex items-center gap-1.5 text-fg-muted">
                    <TagIcon />
                    {articleTags.length ? (
                      <TagChips
                        pool={tags}
                        tags={articleTags}
                      />
                    ) : (
                      t('knowledge.articles.detail.noTags')
                    )}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-fg-muted">
                    <LockOpenIcon />
                    {t('knowledge.articles.detail.generalInfo')}
                  </span>
                  {article.flag_count ? (
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-warning/15 px-2 py-0.5 text-warning-strong dark:text-warning-light">
                      <FlagIcon />
                      {t('knowledge.articles.openReports', { count: article.flag_count })}
                    </span>
                  ) : null}
                </div>
              </article>
            </section>

            <section>
              <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
                  {t('knowledge.articles.detail.sourceSection')}
                </h3>
                {source ? (
                  <span className="text-[12.5px] text-fg-muted">
                    {t('knowledge.articles.detail.lastAccess', { date: formatDate(source.accessed_at) })}
                  </span>
                ) : null}
              </div>

              {source ? (
                <div className="flex flex-wrap items-center gap-3 rounded-bubble border border-border bg-surface-1 px-4 py-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-info/15 text-info-strong dark:text-info-light">
                    <LinkSimpleIcon size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="block text-[12px] text-fg-muted">
                      {source.source?.name ?? t('knowledge.articles.detail.sourceFallback')} ·{' '}
                      {t('knowledge.articles.detail.version', { version: source.version })}
                    </span>
                    <a
                      className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-primary-strong no-underline hover:underline dark:text-primary-light"
                      href={source.url}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {source.title}
                      <ArrowSquareOutIcon size={13} />
                    </a>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-md bg-success/15 px-2 py-0.5 text-[12px] font-medium text-success-strong dark:text-success-light">
                    <CheckIcon size={12} />
                    {t('knowledge.articles.detail.verified')}
                  </span>
                </div>
              ) : (
                // 05 §3: kaynağa dayanmayan kayıt eksiktir; bunu saklamıyoruz.
                <Alert severity="warning">{t('knowledge.articles.detail.noSource')}</Alert>
              )}
            </section>

            {history.length ? (
              <section>
                <button
                  aria-expanded={historyOpen}
                  className="flex w-full items-center justify-between gap-3 rounded-bubble border border-border bg-surface px-4 py-2.5 text-left"
                  onClick={() => setHistoryOpen(open => !open)}
                  type="button"
                >
                  <span className="text-[13.5px] font-medium">{t('knowledge.articles.detail.history')}</span>
                  <span className="inline-flex items-center gap-2 text-[12.5px] text-fg-muted">
                    {t('knowledge.articles.detail.historyCount', { count: history.length })}
                    <CaretDownIcon
                      className={`transition ${historyOpen ? 'rotate-180' : ''}`}
                      size={13}
                    />
                  </span>
                </button>

                {historyOpen ? (
                  <div className="mt-2 flex flex-col gap-2">
                    {history.map((version, index) => (
                      <div
                        className="rounded-bubble border border-border bg-surface-1 px-4 py-3"
                        key={`${version.date}-${index}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <strong className="text-[13px]">
                            {t('knowledge.articles.detail.versionLabel', { index: index + 1 })}
                          </strong>
                          <span className="text-[12px] text-fg-muted">{formatDateTime(version.date)}</span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-fg-muted">
                          {version.content}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>
            ) : null}

            <section className="flex flex-col gap-2.5 border-t border-border pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  className="normal-case"
                  disabled={busy}
                  onClick={() => onFeedback('onay')}
                  size="small"
                  startIcon={<ThumbsUpIcon />}
                  variant={feedback?.mine === 'onay' ? 'contained' : 'outlined'}
                >
                  {t('knowledge.articles.detail.approve')}
                  {feedback?.approvals ? ` (${feedback.approvals})` : ''}
                </Button>
                <Button
                  className="normal-case"
                  color={feedback?.mine === 'red' ? 'error' : 'primary'}
                  disabled={busy}
                  onClick={() => onFeedback('red')}
                  size="small"
                  startIcon={<ThumbsDownIcon />}
                  variant={feedback?.mine === 'red' ? 'contained' : 'outlined'}
                >
                  {t('knowledge.articles.detail.reject')}
                  {feedback?.rejections ? ` (${feedback.rejections})` : ''}
                </Button>
                <Button
                  className="normal-case"
                  color="inherit"
                  disabled={busy}
                  onClick={onReport}
                  size="small"
                  startIcon={<FlagIcon />}
                >
                  {t('knowledge.articles.detail.report')}
                </Button>
                {canEdit ? (
                  <Button
                    className="ml-auto normal-case"
                    disabled={busy}
                    onClick={onEdit}
                    size="small"
                    startIcon={<PencilSimpleIcon />}
                    variant="contained"
                  >
                    {t('knowledge.articles.detail.update')}
                  </Button>
                ) : null}
              </div>

              {readOnly ? (
                <p className="inline-flex items-center gap-1.5 text-[12.5px] text-fg-muted">
                  <LockIcon size={13} />
                  {t('knowledge.articles.detail.readOnlyNote')}
                </p>
              ) : null}
            </section>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
