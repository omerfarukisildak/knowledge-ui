'use client';

import { useCallback, useRef, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { DASI_ASSETS, DASI_TRANSITIONS, type DasiState } from 'src/modules/knowledge/constants';

/**
 * Dasi durum makinesi — `Tanıtım/14-dasi-etkilesim-sistemi.md` §5:
 *
 *   IDLE → WELCOME → LISTENING → THINKING → ANSWERING → SUCCESS
 *   THINKING → NOT_FOUND → EXPERT_HELP
 *   THINKING → ERROR
 *
 * 14 §7: state MANTIĞI ilk turda da gerçek kurulur; farklılaşan tek şey her
 * state'in görsel kalitesidir. Asset yolları `constants.ts` içindeki tabloda —
 * animasyonlar geldiğinde yalnızca o tablo değişir, bu dosya değişmez.
 */

export interface DasiMachine {
  state: DasiState;
  /** Hero altındaki durum yazısı; `null` ise yazı gizlenir. */
  message: string | null;
  /** O state'in 14 §2 tablosundaki mesajı (sohbet balonu için). */
  messageFor: (state: DasiState) => string | null;
  go: (next: DasiState, options?: { message?: string | null }) => void;
}

export function useDasiMachine(initial: DasiState = 'idle'): DasiMachine {
  const { t } = useTranslation();
  const [state, setState] = useState<DasiState>(initial);
  const [override, setOverride] = useState<string | null | undefined>(undefined);
  // `go` referansının stabil kalması için mevcut state ref'te tutuluyor; aksi
  // hâlde her geçişte yeniden üretilip effect'leri tetikliyordu.
  const stateRef = useRef<DasiState>(initial);

  const messageFor = useCallback(
    (target: DasiState) => {
      const key = DASI_ASSETS[target].messageKey;

      return key ? t(key) : null;
    },
    [t]
  );

  const go = useCallback((next: DasiState, options?: { message?: string | null }) => {
    if (!DASI_ASSETS[next]) {
      console.warn(`[Dasi] Tanımsız durum: ${next}`);

      return;
    }

    const current = stateRef.current;
    if (current && !(DASI_TRANSITIONS[current] ?? []).includes(next) && current !== next) {
      // Tanımsız geçiş — 07 §4 gereği sessizce geçiştirilmez, konsola yazılır.
      console.warn(`[Dasi] Tanımsız geçiş: ${current} → ${next} (yine de uygulanıyor)`);
    }

    stateRef.current = next;
    setState(next);
    setOverride(options && 'message' in options ? options.message : undefined);
  }, []);

  const message = override === undefined ? messageFor(state) : override;

  return { go, message, messageFor, state };
}
