'use client';

import * as React from 'react';

import type { DasiState } from 'src/modules/knowledge/constants';

import { DasiMedia } from './dasi-media';

/**
 * Sohbet balonları. Kullanıcı mesajı sağda ve dolu renkte, Dasi mesajı solda
 * avatarıyla birlikte — referans görseldeki düzen.
 */

export type BubbleTone = 'default' | 'warning' | 'error';

const TONE_CLASSES: Record<BubbleTone, string> = {
  default: 'bg-surface border-border',
  warning: 'bg-warning/10 border-warning/35',
  error: 'bg-error/10 border-error/35'
};

export function UserMessage({ text, meta }: { text: string; meta?: string }): React.JSX.Element {
  return (
    <div className="flex justify-end gap-3">
      <div className="max-w-[88%] rounded-bubble bg-primary px-4 py-3.5 text-primary-contrast md:max-w-[78%]">
        <div className="whitespace-pre-wrap">{text}</div>
        {meta ? <div className="mt-1.5 text-[13px] opacity-80">{meta}</div> : null}
      </div>
    </div>
  );
}

/** Dasi balonu: solda animasyonlu avatar, sağında içerik. */
export function DasiMessage({
  avatarState,
  tone = 'default',
  children
}: {
  avatarState: DasiState;
  tone?: BubbleTone;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-surface shadow-card">
        <div className="h-[80%] w-[80%]">
          <DasiMedia
            resolution={128}
            state={avatarState}
          />
        </div>
      </div>
      <div className={`min-w-0 flex-1 rounded-bubble border px-4 py-3.5 ${TONE_CLASSES[tone]}`}>{children}</div>
    </div>
  );
}

/** Dasi çalışırken gösterilen üç nokta — avatarda o state'in animasyonu oynar. */
export function TypingIndicator({ avatarState }: { avatarState: DasiState }): React.JSX.Element {
  return (
    <DasiMessage avatarState={avatarState}>
      <div className="flex items-center gap-1 py-1">
        {[0, 1, 2].map(index => (
          <span
            className="h-[7px] w-[7px] animate-kb-typing rounded-full bg-fg-subtle"
            key={index}
            style={{ animationDelay: `${index * 0.18}s` }}
          />
        ))}
      </div>
    </DasiMessage>
  );
}
