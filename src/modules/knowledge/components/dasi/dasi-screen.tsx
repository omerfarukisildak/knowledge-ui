'use client';

import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';

import { ArrowClockwise as ArrowClockwiseIcon } from '@phosphor-icons/react/dist/ssr/ArrowClockwise';
import { Sparkle as SparkleIcon } from '@phosphor-icons/react/dist/ssr/Sparkle';
import { Tray as TrayIcon } from '@phosphor-icons/react/dist/ssr/Tray';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  createQuestion,
  getArticles,
  getCompanies,
  getTags,
  rateAnswer,
  verifyAnswer
} from 'src/modules/knowledge/api';
import { Typewriter } from 'src/modules/knowledge/components/common/typewriter';
import type { DasiState } from 'src/modules/knowledge/constants';
import { useKnowledgeRole } from 'src/modules/knowledge/contexts/role-context';
import { useAsyncAction } from 'src/modules/knowledge/hooks/use-async-action';
import type { Answer, ArticleListItem, CompanyListItem, Tag } from 'src/modules/knowledge/types';

import { AnswerBubble } from './answer-bubble';
import { type BubbleTone, DasiMessage, TypingIndicator, UserMessage } from './chat-message';
import { DasiHero } from './dasi-hero';
import { waitOneVideoCycle } from './dasi-media';
import { DiscoverySection } from './discovery-section';
import { type ComposerSubmitPayload, QuestionComposer } from './question-composer';
import { useDasiMachine } from './use-dasi-machine';

/**
 * Dasi ekranı — sohbet merkezli karşılama.
 * Prototip karşılığı: `dasi.html` + `js/pages/dasi.js`.
 *
 * Akıştaki ritim bilinçli: önce Dasi'nin tepkisi GÖRÜLÜR (avatarda animasyon),
 * sonra sözü gelir (balon). Bekleme süresi klibin kendisinden okunur — sabit
 * sayı yazıldığında video yenilendiğinde animasyon yarıda kesiliyordu.
 */

type ChatEntry =
  | { kind: 'user'; id: string; text: string; meta?: string }
  | { kind: 'answer'; id: string; questionId: string; answer: Answer; animate: boolean }
  | {
      kind: 'notice';
      id: string;
      text: string;
      tone: BubbleTone;
      avatarState: DasiState;
      action?: 'retry' | 'newQuestion' | 'pool';
      retryText?: string;
    }
  | { kind: 'typing'; id: string; avatarState: DasiState }
  | { kind: 'info'; id: string; text: string };

/** `Omit` bir birleşim üzerinde dağıtılmaz; bu sarmalayıcı her varyanta ayrı uygular. */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type NewChatEntry = DistributiveOmit<ChatEntry, 'id'>;

let entryCounter = 0;
const nextEntryId = () => `entry-${++entryCounter}`;

export function DasiScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const { user, hasRole } = useKnowledgeRole();
  const dasi = useDasiMachine('idle');
  const { run } = useAsyncAction();

  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [chatStarted, setChatStarted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [refill, setRefill] = useState<{ value: string; nonce: number } | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLDivElement | null>(null);
  const refillNonce = useRef(1);

  const canVerify = hasRole('bilgi_uzmani');

  /* ── İlk açılış: IDLE → WELCOME → LISTENING (14 §5) ── */
  useEffect(() => {
    const toWelcome = setTimeout(() => dasi.go('welcome'), 400);
    const toListening = setTimeout(
      () => dasi.go('listening', { message: t('knowledge.dasi.state.waitingForQuestion') }),
      2600
    );

    return () => {
      clearTimeout(toWelcome);
      clearTimeout(toListening);
    };
    // Yalnızca ilk montajda çalışır; `dasi.go` referansı stabil.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Ekran verileri ── */
  useEffect(() => {
    let cancelled = false;

    Promise.all([getTags({ status: 'aktif' }), getCompanies(), getArticles()])
      .then(([tagList, companyList, articleList]) => {
        if (cancelled) {
          return;
        }
        setTags(tagList);
        // Ç8: yalnızca atandığın şirketlerle soru ilişkilendirilebilir; servis
        // katmanı aynı kuralı yazma anında da uygular.
        setCompanies(companyList.filter(company => company.access !== false));
        setArticles(articleList);
      })
      .catch(error => {
        console.error('[knowledge] Dasi ekranı verileri yüklenemedi.', error);
        toast.error(t('knowledge.dasi.flow.loadFailed'));
      });

    return () => {
      cancelled = true;
    };
  }, [t]);

  /** Yeni balon geldiğinde görünür alana kaydır. */
  useEffect(() => {
    if (!entries.length) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });

    return () => cancelAnimationFrame(frame);
  }, [entries]);

  const push = useCallback((entry: NewChatEntry) => {
    const withId = { ...entry, id: nextEntryId() } as ChatEntry;
    setEntries(current => [...current, withId]);

    return withId.id;
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries(current => current.filter(entry => entry.id !== id));
  }, []);

  /** Bir cevabı yerinde günceller — sohbetin geri kalanı korunur. */
  const replaceAnswer = useCallback((answer: Answer) => {
    setEntries(current =>
      current.map(entry =>
        entry.kind === 'answer' && entry.answer.id === answer.id ? { ...entry, answer, animate: false } : entry
      )
    );
  }, []);

  const focusComposer = useCallback(() => {
    composerRef.current?.querySelector('textarea')?.focus();
    composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  /* ═══ Soru gönderimi ══════════════════════════════════════════════════ */

  const handleSubmit = useCallback(
    async (payload: ComposerSubmitPayload) => {
      setChatStarted(true);
      setBusy(true);
      push({ kind: 'user', meta: payload.contextLabel || undefined, text: payload.text });

      dasi.go('thinking');
      const typingId = push({ avatarState: 'thinking', kind: 'typing' });

      // Mock servis ağa hiç çıkmadığı için çevrimdışıyken de başarılı dönüyordu;
      // gerçek davranışı taklit etmek üzere bağlantı burada kontrol edilir. Gerçek
      // API'ye geçildiğinde bu zararsız bir ön eleme olarak kalır.
      const result = navigator.onLine
        ? await run(
            () =>
              createQuestion({
                privacy_class: payload.privacy_class,
                text: payload.text,
                company_id: payload.company_id,
                tag_id: payload.tag_id
              }),
            { message: t('knowledge.dasi.flow.sendFailed') }
          )
        : null;

      removeEntry(typingId);

      if (!result) {
        // Ağ sorunu ile sunucu hatasını ayırıyoruz: "tekrar dene" demek yerine
        // kullanıcıya neyi kontrol edeceğini söylemek gerekiyor.
        const message = navigator.onLine ? dasi.messageFor('error') : t('knowledge.dasi.flow.offline');
        dasi.go('error', { message });

        const errorTypingId = push({ avatarState: 'error', kind: 'typing' });
        await waitOneVideoCycle('error');
        removeEntry(errorTypingId);

        push({
          action: 'retry',
          avatarState: 'error',
          kind: 'notice',
          retryText: payload.text,
          text: message ?? '',
          tone: 'error'
        });
        setBusy(false);

        return;
      }

      const answer = result.answers[0];

      if (!answer && result.escalated_to_expert) {
        const message = t('knowledge.dasi.flow.routedToExperts');
        dasi.go('expert-help', { message });
        push({ avatarState: 'expert-help', kind: 'notice', text: message, tone: 'warning' });
        setBusy(false);

        return;
      }

      const notFound = Boolean(answer.not_found);
      dasi.go(notFound ? 'not-found' : 'answering');

      if (notFound) {
        // 14 §2 / Vizyon İlke #1 — uydurmaz, dürüstçe söyler ve yönlendirir.
        push({
          avatarState: 'not-found',
          kind: 'notice',
          text: `${dasi.messageFor('not-found')} ${t('knowledge.dasi.flow.notFoundOffer')}`,
          tone: 'warning'
        });
      }

      push({ animate: true, answer, kind: 'answer', questionId: result.id });
      setBusy(false);

      // 14 §5: cevap sunulduktan sonra Dasi yeniden dinlemeye döner.
      setTimeout(() => dasi.go('listening', { message: null }), 2200);
    },
    [dasi, push, removeEntry, run, t]
  );

  /* ═══ Değerlendirme ═══════════════════════════════════════════════════ */

  const handleResolve = useCallback(
    async (answerId: string) => {
      setBusy(true);
      const result = await run(() => rateAnswer(answerId, { sufficient: true }), {
        message: t('knowledge.dasi.flow.rateFailed')
      });
      if (!result) {
        setBusy(false);

        return;
      }

      dasi.go('success');
      // Önce cevap güncellenir (karar düğmeleri kalkar, "Çözüldü" rozeti gelir),
      // kapanış mesajı ondan SONRA eklenir.
      replaceAnswer(result.answer);

      const typingId = push({ avatarState: 'success', kind: 'typing' });
      await waitOneVideoCycle('success');
      removeEntry(typingId);

      push({
        action: 'newQuestion',
        avatarState: 'success',
        kind: 'notice',
        text: `${dasi.messageFor('success')} ${t('knowledge.dasi.flow.solvedFollowUp')}`,
        tone: 'default'
      });
      setBusy(false);
    },
    [dasi, push, removeEntry, replaceAnswer, run, t]
  );

  const handleEscalate = useCallback(
    async (answerId: string) => {
      setBusy(true);
      dasi.go('expert-help');
      const typingId = push({ avatarState: 'expert-help', kind: 'typing' });

      // API hızlı dönüyor; animasyon en az bir tam tur atsın diye beklemeyi UI
      // tarafında uzatıyoruz. `rateAnswer` "Çözüldü" için de kullanıldığından
      // gecikmeyi servise koymak yanlış olurdu.
      const [result] = await Promise.all([
        run(() => rateAnswer(answerId, { sufficient: false }), { message: t('knowledge.dasi.flow.escalateFailed') }),
        waitOneVideoCycle('expert-help')
      ]);
      removeEntry(typingId);

      if (!result) {
        setBusy(false);

        return;
      }

      replaceAnswer(result.answer);
      push({
        action: 'pool',
        avatarState: 'expert-help',
        kind: 'notice',
        text: `${dasi.messageFor('expert-help')} ${t('knowledge.dasi.flow.escalated')}`,
        tone: 'default'
      });
      setBusy(false);
    },
    [dasi, push, removeEntry, replaceAnswer, run, t]
  );

  const handleVerify = useCallback(
    async (answerId: string) => {
      const answer = await run(() => verifyAnswer(answerId), { message: t('knowledge.dasi.flow.verifyFailed') });
      if (!answer) {
        return;
      }
      replaceAnswer(answer);
      toast.success(t('knowledge.dasi.answer.verifySuccess'));
    },
    [replaceAnswer, run, t]
  );

  /* ═══ Görünüm ═════════════════════════════════════════════════════════ */

  const firstName = (user?.name ?? '').split(' ')[0];

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 py-4 md:px-8 md:py-6">
      {/* Karşılama tek yönlüdür: sohbet başladıktan sonra geri gelmez, sayfa
          yenilenince doğal olarak sıfırlanır. */}
      <Collapse in={!chatStarted}>
        <DasiHero
          firstName={firstName}
          state={dasi.state}
          statusMessage={dasi.message}
        />
      </Collapse>

      {entries.length ? (
        <div
          aria-live="polite"
          className={`mb-5 flex flex-col gap-[26px] ${chatStarted ? '' : 'mt-1.5'}`}
        >
          {entries.map(entry => {
            if (entry.kind === 'user') {
              return (
                <UserMessage
                  key={entry.id}
                  meta={entry.meta}
                  text={entry.text}
                />
              );
            }

            if (entry.kind === 'typing') {
              return (
                <TypingIndicator
                  avatarState={entry.avatarState}
                  key={entry.id}
                />
              );
            }

            if (entry.kind === 'info') {
              return (
                <Alert
                  key={entry.id}
                  severity="info"
                >
                  {entry.text}
                </Alert>
              );
            }

            if (entry.kind === 'notice') {
              return (
                <DasiMessage
                  avatarState={entry.avatarState}
                  key={entry.id}
                  tone={entry.tone}
                >
                  <Typewriter text={entry.text} />
                  {entry.action ? (
                    <div className="mt-3.5 flex flex-wrap gap-2">
                      {entry.action === 'retry' ? (
                        <Button
                          onClick={() => {
                            // Doğrudan yeniden göndermiyoruz: gönderim sırasında
                            // şirket/etiket seçimi de temizlendiği için sessizce
                            // eksik bir istek gitmiş olurdu. Metin kutuya geri
                            // konur, kullanıcı seçimlerini gözden geçirir.
                            setRefill({ nonce: refillNonce.current++, value: entry.retryText ?? '' });
                          }}
                          className="normal-case"
                          size="small"
                          startIcon={<ArrowClockwiseIcon />}
                          variant="outlined"
                        >
                          {t('knowledge.dasi.flow.retry')}
                        </Button>
                      ) : null}
                      {entry.action === 'newQuestion' ? (
                        <Button
                          className="normal-case"
                          onClick={focusComposer}
                          size="small"
                          startIcon={<SparkleIcon />}
                          variant="outlined"
                        >
                          {t('knowledge.dasi.flow.newQuestion')}
                        </Button>
                      ) : null}
                      {entry.action === 'pool' ? (
                        <Button
                          className="normal-case"
                          disabled
                          size="small"
                          startIcon={<TrayIcon />}
                          title={t('knowledge.discover.notMigrated')}
                          variant="outlined"
                        >
                          {t('knowledge.dasi.flow.seePool')}
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </DasiMessage>
              );
            }

            return (
              <AnswerBubble
                animate={entry.animate}
                answer={entry.answer}
                canVerify={canVerify}
                disabled={busy}
                key={entry.id}
                onEscalate={() => handleEscalate(entry.answer.id)}
                onResolve={() => handleResolve(entry.answer.id)}
                onVerify={() => handleVerify(entry.answer.id)}
              />
            );
          })}
          <div ref={bottomRef} />
        </div>
      ) : null}

      <div ref={composerRef}>
        <QuestionComposer
          companies={companies}
          disabled={busy}
          onSubmit={handleSubmit}
          onTyping={() => {
            if (dasi.state === 'idle' || dasi.state === 'welcome') {
              dasi.go('listening', { message: null });
            }
          }}
          refill={refill}
          tags={tags}
        />
      </div>

      <Collapse in={!chatStarted}>
        <DiscoverySection articles={articles} />
      </Collapse>
    </div>
  );
}
