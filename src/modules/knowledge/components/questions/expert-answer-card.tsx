'use client';

import * as React from 'react';

import { BookOpen as BookOpenIcon } from '@phosphor-icons/react/dist/ssr/BookOpen';
import { Check as CheckIcon } from '@phosphor-icons/react/dist/ssr/Check';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { Flag as FlagIcon } from '@phosphor-icons/react/dist/ssr/Flag';
import { LinkSimple as LinkSimpleIcon } from '@phosphor-icons/react/dist/ssr/LinkSimple';
import { ThumbsDown as ThumbsDownIcon } from '@phosphor-icons/react/dist/ssr/ThumbsDown';
import { ThumbsUp as ThumbsUpIcon } from '@phosphor-icons/react/dist/ssr/ThumbsUp';
import { useTranslation } from 'react-i18next';

import type { AnswerWithFeedback, KnowledgeUser, QuestionDetail } from 'src/modules/knowledge/types';
import { formatDateTime } from 'src/modules/knowledge/utils/format-date';

import { QuestionAvatar } from './question-avatar';

/**
 * Uzman cevabı kartı — prototipteki `.ds-soru-cevap-kart` bloğunun birebir
 * Tailwind karşılığı.
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

/** Cevap kartı aksiyonu — prototipteki `.ds-btn.sade.kucuk` (beyaz zemin). */
function ActionButton({
  children,
  disabled,
  label,
  onClick
}: {
  children: React.ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}): React.JSX.Element {
  return (
    <button
      aria-label={label}
      className="inline-flex min-h-[30px] items-center gap-1.5 rounded-[9px] border border-[#e5e5e2] bg-white px-[11px] py-1.5 text-[13px] font-medium text-[#59605a] transition hover:bg-[#f7f7f5] disabled:cursor-not-allowed disabled:opacity-50 dark:border-border dark:bg-surface dark:text-fg-muted"
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
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
    <div className="mt-3 overflow-hidden rounded-[13px] border border-[#e7e7e5] bg-white text-[13.5px] shadow-[0_2px_8px_rgba(11,16,32,0.025)] dark:border-border dark:bg-surface">
      {/* Üst — uzman kimliği + tarih */}
      <div className="flex min-h-[62px] flex-wrap items-center justify-between gap-3.5 border-b border-[#eeeeec] bg-[#fbfbfc] px-[15px] py-[11px] dark:border-border dark:bg-surface-1">
        <div className="flex min-w-0 flex-wrap items-center gap-[9px]">
          <QuestionAvatar
            name={name}
            size={36}
            userId={answer.answered_by}
          />
          <span className="flex min-w-0 flex-col leading-[1.2]">
            <span className="inline-flex items-center gap-1.5">
              <strong className="text-[12.5px] font-[650] text-[#171816] dark:text-fg">{name}</strong>
              {/* Doğrulama tiki yalnızca gerçekten verified kayıtta. */}
              {answer.verified ? (
                <span
                  aria-label={t('knowledge.questions.answer.verifiedTitle')}
                  className="grid h-[17px] w-[17px] shrink-0 place-items-center rounded-full bg-[#168de2] text-white shadow-[0_0_0_2px_#fbfbfc]"
                  role="img"
                  title={t('knowledge.questions.answer.verifiedTitle')}
                >
                  <CheckIcon
                    size={11}
                    weight="bold"
                  />
                </span>
              ) : null}
            </span>
            <small className="mt-[3px] block text-[10.5px] text-[#979994]">{title}</small>
          </span>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-[11.5px] text-[#979994]">
          <ClockIcon size={13} />
          {formatDateTime(answer.created_at)}
        </span>
      </div>

      {/* Gövde — cevap metni + ekler + kaynaklar */}
      <div className="p-[15px]">
        <div className="whitespace-pre-wrap leading-[1.6] text-[#171816] dark:text-fg">
          {text || t('knowledge.questions.answer.missingText')}
        </div>

        {answer.masked ? <p className="mt-2 text-[13px] text-[#979994]">{t('knowledge.privacy.maskedNote')}</p> : null}

        {(answer.attachments ?? []).length ? (
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            {answer.attachments.map(attachment => (
              <span
                className="inline-flex items-center gap-[5px] rounded-md bg-[#eef0f6] px-2 py-[3px] text-[12.5px] text-[#626b8c]"
                key={attachment}
              >
                <LinkSimpleIcon size={13} />
                {attachment}
              </span>
            ))}
          </div>
        ) : null}

        {/* Uzmanın cevabında gösterdiği Bilgi Bankası kayıtları. */}
        {(answer.references ?? []).length ? (
          <div className="mt-3 flex flex-col gap-2 border-t border-[#eeeeec] pt-3 dark:border-border">
            {answer.references.map(reference => (
              <span
                className="flex items-center gap-[9px] text-[13.5px] text-[#171816] dark:text-fg"
                key={reference}
              >
                <BookOpenIcon
                  className="shrink-0 text-[#8c8e89]"
                  size={16}
                />
                {reference}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {/* Aksiyonlar */}
      <div className="flex flex-wrap gap-2 border-t border-[#eeeeec] bg-[#fbfbfc] px-3.5 py-2.5 dark:border-border dark:bg-surface-1">
        <ActionButton
          disabled={disabled}
          label={t('knowledge.questions.answer.like')}
          onClick={() => onFeedback('onay')}
        >
          <ThumbsUpIcon size={15} />
          {likes || ''}
        </ActionButton>
        <ActionButton
          disabled={disabled}
          label={t('knowledge.questions.answer.dislike')}
          onClick={() => onFeedback('red')}
        >
          <ThumbsDownIcon size={15} />
          {dislikes || ''}
        </ActionButton>
        <ActionButton
          disabled={disabled}
          label={t('knowledge.questions.answer.report')}
          onClick={onReport}
        >
          <FlagIcon size={15} />
          {t('knowledge.questions.answer.report')}
        </ActionButton>
      </div>
    </div>
  );
}
