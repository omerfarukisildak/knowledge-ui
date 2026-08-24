'use client';

import * as React from 'react';

import { useTranslation } from 'react-i18next';

import { DASI_HERO_VIDEO_STATES, type DasiState } from 'src/modules/knowledge/constants';

import { DasiMedia } from './dasi-media';

/**
 * Karşılama başlığı — referans görselin birebir karşılığı: yıldızlı bir ışık
 * halesi, ortasında Dasi, altında selamlama ve durum yazısı.
 *
 * Hero yalnızca "Dasi burada" hissini veren nötr loop'u oynatır. Araştırma
 * animasyonu sohbetteki yazıyor göstergesinin avatarında gösterilir — kullanıcı
 * soru sorduğunda gözü orada oluyor, hero zaten yukarı kayıp görünmez oluyor.
 */

/** Sabit koordinatlar: rastgele dağılım her render'da yıldızları zıplatıyordu. */
const STARS = [
  [18, 22],
  [30, 58],
  [72, 18],
  [82, 52],
  [26, 76],
  [67, 72],
  [11, 44],
  [90, 30]
] as const;

function greetingKey(hour: number): string {
  if (hour < 6) return 'knowledge.dasi.greeting.night';
  if (hour < 12) return 'knowledge.dasi.greeting.morning';
  if (hour < 18) return 'knowledge.dasi.greeting.afternoon';

  return 'knowledge.dasi.greeting.evening';
}

export interface DasiHeroProps {
  state: DasiState;
  statusMessage: string | null;
  firstName: string;
}

export function DasiHero({ state, statusMessage, firstName }: DasiHeroProps): React.JSX.Element {
  const { t } = useTranslation();
  // Saat yalnızca ilk render'da okunur: her yeniden çizimde yeni bir Date
  // üretmek, gece yarısını geçen oturumlarda selamlamayı sebepsiz oynatıyordu.
  const [greeting] = React.useState(() => t(greetingKey(new Date().getHours())));

  return (
    <section className="relative pb-8 pt-6 text-center">
      {/* Işık halesi: referans görseldeki mavi parıltı. Hero'nun arkasında durur. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-70px] z-0 h-[340px] w-[560px] -translate-x-1/2 bg-[image:var(--kb-hero-glow)] md:h-[470px] md:w-[900px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
      >
        {STARS.map(([left, top]) => (
          <span
            className="absolute h-[3px] w-[3px] animate-kb-star rounded-full bg-star shadow-[0_0_6px_2px_var(--kb-star-glow)] motion-reduce:animate-none motion-reduce:opacity-50"
            key={`${left}-${top}`}
            style={{ animationDelay: `${(left % 7) * 0.4}s`, left: `${left}%`, top: `${top}%` }}
          />
        ))}
      </div>

      <div className="relative z-[1]">
        <div className="relative mx-auto mb-3.5 h-[132px] w-[132px] md:h-[190px] md:w-[190px]">
          <DasiMedia
            playVideo={DASI_HERO_VIDEO_STATES.includes(state)}
            resolution={320}
            state={state}
          />
        </div>

        <h1 className="mb-1.5 text-[25px] font-bold leading-tight tracking-[-0.02em] md:text-[34px]">
          {greeting}
          {firstName ? `, ${firstName}` : ''}!
        </h1>
        {/* Dasi'nin KAPSAMINI söyler: kullanıcı ne sorabileceğini tek satırda görür. */}
        <p className="text-base text-fg-muted">{t('knowledge.dasi.heroSubtitle')}</p>

        <div className="mt-3 min-h-[34px]">
          {statusMessage ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-[13px] text-fg-muted shadow-card">
              {state === 'thinking' && <span className="h-[7px] w-[7px] animate-kb-pulse rounded-full bg-primary" />}
              <span>{statusMessage}</span>
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}
