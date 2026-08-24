'use client';

import * as React from 'react';

import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';

import { BookOpen as BookOpenIcon } from '@phosphor-icons/react/dist/ssr/BookOpen';
import { Check as CheckIcon } from '@phosphor-icons/react/dist/ssr/Check';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { Flag as FlagIcon } from '@phosphor-icons/react/dist/ssr/Flag';
import { LinkSimple as LinkSimpleIcon } from '@phosphor-icons/react/dist/ssr/LinkSimple';
import { ThumbsDown as ThumbsDownIcon } from '@phosphor-icons/react/dist/ssr/ThumbsDown';
import { ThumbsUp as ThumbsUpIcon } from '@phosphor-icons/react/dist/ssr/ThumbsUp';
import { useTranslation } from 'react-i18next';

import { UserAvatar } from 'src/modules/knowledge/components/common/user-avatar';
import type { AnswerWithFeedback, KnowledgeUser, QuestionDetail } from 'src/modules/knowledge/types';
import { formatDateTime } from 'src/modules/knowledge/utils/format-date';

/**
 * Uzman cevabı kartı.
 *
 * V43: Bu ekran yalnızca UZMAN cevaplarını gösterir. Dasi'nin otomatik cevabı,
 * derin araştırma çıktısı ve sonuçsuz taraması buraya hiç gelmez — onların yeri
 * Dasi ekranı.
 */

/**
 * Tohum verideki bazı cevaplar ilk satırda sorunun kendisini tekrar ediyor.
 * Soru zaten hemen üstte durduğu için yalnızca gerçek cevap metni bırakılır.
 */
function stripRepeatedQuestion(answerText: string, questionText: string): string {
  const answer = answerText.trim();
  const question = questionText.trim();

  let result =
    question && answer.toLocaleLowerCase('tr-TR').startsWith(question.toLocaleLowerCase('tr-TR'))
      ? answer
          .slice(question.length)
          .replace(/^[\s:–—-]+/, '')
          .trim()
      : answer;

  // Soru bazen farklı kelimelerle yeniden yazılmış oluyor: ilk paragraf soru
  // işaretiyle bitiyorsa onu da tekrar kabul et.
  const paragraphs = result
    .split(/\n\s*\n/)
    .map(part => part.trim())
    .filter(Boolean);
  if (paragraphs.length > 1 && /\?\s*$/.test(paragraphs[0])) {
    result = paragraphs.slice(1).join('\n\n');
  }

  return result;
}

export interface ExpertAnswerCardProps {
  answer: AnswerWithFeedback;
  question: QuestionDetail;
  author: KnowledgeUser | null;
  disabled?: boolean;
  onFeedback: (value: 'onay' | 'red') => void;
  onReport: () => void;
}

export function ExpertAnswerCard({
  answer,
  question,
  author,
  disabled,
  onFeedback,
  onReport
}: ExpertAnswerCardProps): React.JSX.Element {
  const { t } = useTranslation();

  const name = author?.name ?? t('knowledge.questions.answer.expertFallback');
  const title = author
    ? t(`knowledge.questions.titles.${author.role}`)
    : t('knowledge.questions.answer.expertFallback');
  const text = stripRepeatedQuestion(answer.text ?? '', question.text ?? '');

  const feedback = answer.feedback ?? [];
  const likes = feedback.filter(entry => entry.value === 'onay').length;
  const dislikes = feedback.filter(entry => entry.value === 'red').length;

  return (
    <div className="rounded-bubble border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <UserAvatar name={name} />
          <div>
            <div className="flex items-center gap-1.5">
              <strong>{name}</strong>
              {/* Doğrulama tiki yalnızca gerçekten verified kayıtta. */}
              {answer.verified ? (
                <Tooltip title={t('knowledge.questions.answer.verifiedTitle')}>
                  <span
                    aria-label={t('knowledge.questions.answer.verifiedTitle')}
                    className="grid place-items-center text-success-strong dark:text-success-light"
                    role="img"
                  >
                    <CheckIcon
                      size={15}
                      weight="bold"
                    />
                  </span>
                </Tooltip>
              ) : null}
            </div>
            <small className="text-fg-muted">{title}</small>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[13px] text-fg-muted">
          <ClockIcon />
          {formatDateTime(answer.created_at)}
        </span>
      </div>

      <div className="px-4 py-3.5">
        <div className="whitespace-pre-wrap">{text || t('knowledge.questions.answer.missingText')}</div>

        {answer.masked ? <p className="mt-2 text-[13px] text-fg-muted">{t('knowledge.privacy.maskedNote')}</p> : null}

        {(answer.attachments ?? []).length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {answer.attachments.map(attachment => (
              <Chip
                className="bg-fg-muted/10 text-fg-muted"
                icon={<LinkSimpleIcon />}
                key={attachment}
                label={attachment}
                size="small"
              />
            ))}
          </div>
        ) : null}

        {/* Uzmanın cevabında gösterdiği Bilgi Bankası kayıtları. Bilgi Bankası
            ekranı henüz taşınmadı, o yüzden kimlik düz text olarak duruyor. */}
        {(answer.references ?? []).length ? (
          <div className="mt-3 border-t border-border pt-3">
            <p className="mb-1.5 text-[13px] text-fg-muted">{t('knowledge.questions.answer.sources')}</p>
            <div className="flex flex-col gap-1.5">
              {answer.references.map(reference => (
                <span
                  className="flex items-center gap-2 text-[13.5px]"
                  key={reference}
                >
                  <BookOpenIcon />
                  {reference}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border px-4 py-2.5">
        <Button
          aria-label={t('knowledge.questions.answer.like')}
          className="min-w-0 normal-case text-fg-muted"
          disabled={disabled}
          onClick={() => onFeedback('onay')}
          size="small"
          startIcon={<ThumbsUpIcon />}
        >
          {likes || ''}
        </Button>
        <Button
          aria-label={t('knowledge.questions.answer.dislike')}
          className="min-w-0 normal-case text-fg-muted"
          disabled={disabled}
          onClick={() => onFeedback('red')}
          size="small"
          startIcon={<ThumbsDownIcon />}
        >
          {dislikes || ''}
        </Button>
        <Button
          className="normal-case text-fg-muted"
          disabled={disabled}
          onClick={onReport}
          size="small"
          startIcon={<FlagIcon />}
        >
          {t('knowledge.questions.answer.report')}
        </Button>
      </div>
    </div>
  );
}
