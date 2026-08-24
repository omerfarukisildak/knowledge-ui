import { ESCALATION_SLA } from 'src/modules/knowledge/constants';
import type { Question } from 'src/modules/knowledge/types';

/**
 * Havuzun SLA aritmetiği — prototipin `havuz.js` süre yardımcılarının karşılığı.
 *
 * Ekranın gösterdiği her rakam buradan türer; sabit metin yoktur. Süre hem
 * kartta hem panoda hem modalda göründüğü için hesap tek yerde durur.
 */

export type SlaLevel = 'normal' | 'warning' | 'critical';

/** V8: tarih-only kayıtlarda saat 09:00 varsayılır — `format-date` ile aynı kural. */
function timeOf(value?: string | null): number | null {
  if (!value) {
    return null;
  }
  const parsed = new Date(value.length <= 10 ? `${value}T09:00:00` : value).getTime();

  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Bekleme başlangıcı: havuza düştüğü an, yoksa sorulduğu an.
 *
 * `waiting_hours` servis katmanından da geliyor ama o değer yanıt anında
 * donuyor. Ekran açık kaldıkça süre işlemeye devam etmeli, bu yüzden kartlar
 * tarihten kendileri hesaplıyor.
 */
export function waitedHours(question: Pick<Question, 'escalated_at' | 'created_at'>, nowMs: number): number {
  const start = timeOf(question.escalated_at) ?? timeOf(question.created_at);

  return start === null ? 0 : Math.max(0, (nowMs - start) / 36e5);
}

export function slaLevel(hours: number): SlaLevel {
  if (hours >= ESCALATION_SLA.breachHours) {
    return 'critical';
  }

  return hours >= ESCALATION_SLA.targetHours ? 'warning' : 'normal';
}

export interface DurationPart {
  value: number;
  /** i18n anahtarı — `knowledge.escalations.unit.*` */
  unitKey: string;
}

/**
 * Süreyi kısaltmak yerine okunabilir birim gruplarına böler: "2 gün 3 saat",
 * "5 saat 20 dk", "12 dk". Tek bir ondalıklı saat rakamı ("1,8 saat") nöbet
 * ekranında okunmuyordu.
 */
export function durationParts(hours: number): DurationPart[] {
  const totalMinutes = Math.max(1, Math.round(hours * 60));

  if (totalMinutes >= 24 * 60) {
    const days = Math.floor(totalMinutes / (24 * 60));
    const restHours = Math.floor((totalMinutes % (24 * 60)) / 60);

    return [
      { value: days, unitKey: 'knowledge.escalations.unit.day' },
      ...(restHours ? [{ value: restHours, unitKey: 'knowledge.escalations.unit.hour' }] : [])
    ];
  }

  if (totalMinutes >= 60) {
    const wholeHours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return [
      { value: wholeHours, unitKey: 'knowledge.escalations.unit.hour' },
      ...(minutes ? [{ value: minutes, unitKey: 'knowledge.escalations.unit.minute' }] : [])
    ];
  }

  return [{ value: totalMinutes, unitKey: 'knowledge.escalations.unit.minute' }];
}

/** Panonun özet rakamları — kuyruk boşsa hepsi sıfırdır. */
export interface QueueStats {
  total: number;
  critical: number;
  warning: number;
  onTime: number;
  longestHours: number;
  averageHours: number;
}

export function queueStats(hours: number[]): QueueStats {
  return {
    total: hours.length,
    critical: hours.filter(entry => slaLevel(entry) === 'critical').length,
    warning: hours.filter(entry => slaLevel(entry) === 'warning').length,
    onTime: hours.filter(entry => slaLevel(entry) === 'normal').length,
    longestHours: hours.length ? Math.max(...hours) : 0,
    averageHours: hours.length ? hours.reduce((total, entry) => total + entry, 0) / hours.length : 0
  };
}
