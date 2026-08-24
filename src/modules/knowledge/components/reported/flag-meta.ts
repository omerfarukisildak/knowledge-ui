import type { FlagTargetKind } from 'src/modules/knowledge/types';

/**
 * Rapor ekranının etiket tabloları — prototipin `HEDEF_ETIKET` / `DURUM_ETIKET`
 * / `SONUC_ETIKET` sabitlerinin karşılığı.
 *
 * V40: "Güncellendi" artık bir DURUM değil, kapanışın SONUCU. Bu yüzden durum
 * ve sonuç iki ayrı tabloda duruyor; kart ikisini yan yana gösterir.
 */

export type FlagStatus = 'acik' | 'inceleniyor' | 'kapandi';
export type FlagOutcome = 'guncellendi' | 'degisiklik_gerekmedi';

export const FLAG_STATUSES: FlagStatus[] = ['acik', 'inceleniyor', 'kapandi'];

/** Kart üstündeki hedef türü rozeti. */
export const TARGET_META: Record<FlagTargetKind, { labelKey: string; icon: 'book' | 'file' | 'question' }> = {
  kb_kaydi: { labelKey: 'knowledge.reported.target.kb_kaydi', icon: 'book' },
  cevap: { labelKey: 'knowledge.reported.target.cevap', icon: 'file' },
  soru: { labelKey: 'knowledge.reported.target.soru', icon: 'question' }
};

/** Tam sınıf adları: Tailwind çalışma anında kurulan adları göremez. */
export const STATUS_TONE: Record<FlagStatus, string> = {
  acik: 'bg-warning/15 text-warning-strong dark:text-warning-light',
  inceleniyor: 'bg-info/15 text-info-strong dark:text-info-light',
  kapandi: 'bg-fg-muted/10 text-[var(--mui-palette-neutral-600)] dark:text-fg-muted'
};

export const OUTCOME_TONE: Record<FlagOutcome, string> = {
  guncellendi: 'bg-success/15 text-success-strong dark:text-success-light',
  degisiklik_gerekmedi: 'bg-fg-muted/10 text-[var(--mui-palette-neutral-600)] dark:text-fg-muted'
};

/**
 * Kaynak bağlantısı yalnızca http(s) ise gösterilir — prototipin
 * `guvenliKaynakURL` kontrolü. `javascript:` gibi şemalar dışarıda kalır.
 */
export function safeSourceUrl(url?: string | null): string | null {
  const value = String(url ?? '').trim();

  return /^https?:\/\//i.test(value) ? value : null;
}
