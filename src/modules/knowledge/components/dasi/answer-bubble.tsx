'use client';

import * as React from 'react';

import Button from '@mui/material/Button';

import { BookOpen as BookOpenIcon } from '@phosphor-icons/react/dist/ssr/BookOpen';
import { Check as CheckIcon } from '@phosphor-icons/react/dist/ssr/Check';
import { SealCheck as SealCheckIcon } from '@phosphor-icons/react/dist/ssr/SealCheck';
import { Sparkle as SparkleIcon } from '@phosphor-icons/react/dist/ssr/Sparkle';
import { Tray as TrayIcon } from '@phosphor-icons/react/dist/ssr/Tray';
import { useTranslation } from 'react-i18next';

import { SoftChip, StatusChip, VerifiedBadge } from 'src/modules/knowledge/components/common/status-chip';
import { Typewriter } from 'src/modules/knowledge/components/common/typewriter';
import type { Answer } from 'src/modules/knowledge/types';

import { DasiMessage } from './chat-message';

/**
 * Cevap balonu — rozetler, kaynaklar, uyarılar ve akışı ilerleten aksiyonlar.
 *
 * Sohbette YALNIZCA akışı ilerleten eylemler durur. Beğeni/beğenmeme ve
 * raporlama içerik yönetişimi işleri; onların yeri Sorular ekranı. Her cevabın
 * altına altı düğme koymak asıl kararı (çözüldü mü?) boğuyordu.
 */

export interface AnswerBubbleProps {
  answer: Answer;
  /** Yeni gelen cevap daktiloyla açılır; yeniden çizimlerde animasyon olmaz. */
  animate?: boolean;
  /** FR-7: yalnızca Bilgi Uzmanı bir AI cevabını verified'a yükseltebilir. */
  canVerify: boolean;
  disabled?: boolean;
  onEscalate: () => void;
  onResolve: () => void;
  onVerify: () => void;
}

export function AnswerBubble({
  answer,
  animate,
  canVerify,
  disabled,
  onEscalate,
  onResolve,
  onVerify
}: AnswerBubbleProps): React.JSX.Element {
  const { t } = useTranslation();

  const notFound = Boolean(answer.not_found) || /bulunamadı/i.test(answer.text);
  const isExpert = answer.kind === 'uzman';
  const articleRefs = answer.references ?? [];

  return (
    <DasiMessage
      avatarState={notFound ? 'not-found' : 'answering'}
      tone={notFound ? 'warning' : 'default'}
    >
      <div className="mb-2 flex flex-wrap gap-1.5">
        {isExpert ? (
          <SoftChip
            icon={<SealCheckIcon />}
            label={t('knowledge.dasi.answer.expert')}
            tone="success"
          />
        ) : (
          <SoftChip
            icon={<SparkleIcon />}
            label={t('knowledge.dasi.answer.automatic')}
            tone="info"
          />
        )}
        <VerifiedBadge verified={answer.verified} />
        {answer.rating ? <StatusChip status={answer.rating === 'yeterli' ? 'cozuldu' : 'eskale_edildi'} /> : null}
      </div>

      {animate ? <Typewriter text={answer.text} /> : <div className="whitespace-pre-wrap">{answer.text}</div>}

      {answer.masked ? <p className="mt-2 text-[13px] text-fg-muted">{t('knowledge.privacy.maskedNote')}</p> : null}

      {articleRefs.length ? (
        <div className="mt-3 border-t border-border pt-3">
          <p className="mb-1.5 text-[13px] text-fg-muted">{t('knowledge.dasi.answer.sourceArticles')}</p>
          <div className="flex flex-col gap-1.5">
            {articleRefs.map(reference => (
              <div
                className="flex items-center gap-2 text-[13.5px]"
                key={reference}
              >
                <BookOpenIcon />
                {/* Bilgi Bankası ekranı henüz taşınmadı — kayıt kimliği düz text
                    olarak duruyor, ekran gelince bağlantıya dönecek. */}
                <span>{reference}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {(notFound || (!answer.verified && !isExpert && canVerify)) && (
        <div className="mt-3.5 flex flex-wrap gap-2">
          {notFound ? (
            <Button
              className="normal-case"
              disabled={disabled}
              onClick={onEscalate}
              size="small"
              startIcon={<TrayIcon />}
              variant="contained"
            >
              {t('knowledge.dasi.answer.ratingInsufficient')}
            </Button>
          ) : null}
          {!answer.verified && !isExpert && canVerify ? (
            <Button
              className="normal-case"
              disabled={disabled}
              onClick={onVerify}
              size="small"
              startIcon={<SealCheckIcon />}
              variant="outlined"
            >
              {t('knowledge.dasi.answer.verifyAction')}
            </Button>
          ) : null}
        </div>
      )}

      {/* Değerlendirme: cevabın kalitesini puanlatmak yerine kullanıcıya ne
          olacağını sorar. "Çözüldü" sonucu söylüyor ve uygulamanın kendi status
          diliyle aynı; "Uzmana sor" ise sıradaki adımı söylüyor. */}
      {!notFound && !answer.rating ? (
        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <p className="text-[13.5px] text-fg-muted">{t('knowledge.dasi.answer.ratingQuestion')}</p>
          <div className="flex gap-2">
            <Button
              className="normal-case"
              color="success"
              disabled={disabled}
              onClick={onResolve}
              size="small"
              startIcon={<CheckIcon />}
              variant="outlined"
            >
              {t('knowledge.dasi.answer.ratingSufficient')}
            </Button>
            <Button
              className="normal-case"
              disabled={disabled}
              onClick={onEscalate}
              size="small"
              startIcon={<TrayIcon />}
              variant="outlined"
            >
              {t('knowledge.dasi.answer.ratingInsufficient')}
            </Button>
          </div>
        </div>
      ) : null}
    </DasiMessage>
  );
}
