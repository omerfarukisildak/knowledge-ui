import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

/**
 * Prototipin `tarihSaat` / `gecenSure` yardımcılarının karşılığı.
 *
 * V8: tarih-only kayıtlarda (`YYYY-MM-DD`) saat 09:00 varsayılır — tohum veride
 * saatsiz kayıtlar var ve bunlar gün başına düştüğünde "16 saat önce" gibi
 * yanıltıcı değerler üretiyordu.
 */
function toDate(value?: string | null): dayjs.Dayjs | null {
  if (!value) {
    return null;
  }
  const parsed = dayjs(value.length <= 10 ? `${value}T09:00:00` : value);

  return parsed.isValid() ? parsed : null;
}

export function formatDate(value?: string | null, locale = 'tr'): string {
  return toDate(value)?.locale(locale).format('DD.MM.YYYY') ?? '—';
}

export function formatDateTime(value?: string | null, locale = 'tr'): string {
  // Prototipteki `tarihSaat` ile aynı: "24 Ağustos 2026, 09:05".
  return toDate(value)?.locale(locale).format('D MMMM YYYY, HH:mm') ?? '—';
}

/** "3 gün önce" biçimi; liste satırlarında tam tarihten daha okunur. */
export function formatRelative(value?: string | null, locale = 'tr'): string {
  return toDate(value)?.locale(locale).fromNow() ?? '—';
}
