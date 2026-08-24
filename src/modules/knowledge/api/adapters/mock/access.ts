import { seedCompanies } from 'src/modules/knowledge/mocks/seed-data';
import type { Answer, Article, Company, KnowledgeUser, PrivacyClass, Question } from 'src/modules/knowledge/types';

import type { MockStore } from './store';

/**
 * Erişim kapısı ve maskeleme — gerçek sistemde ikisi de sunucu tarafındadır.
 * Mock adaptörü aynı kuralı taklit eder ki UI, backend geldiğinde davranış
 * değişikliği yaşamasın.
 */

/* ═══ Maskeleme — V3 / 04-KVKK §4 ════════════════════════════════════════ */

/**
 * Prototipte otomatik PII TESPİTİ YOKTUR (11 §2 "basitleştirilmiş"). Maskeleme
 * yalnızca `privacy_class === 'kisisel_veri'` olarak İŞARETLENMİŞ kayıtlarda,
 * basit kalıplar üzerinde uygulanır. Gerçek tespit motoru Faz 3'te devreye girer.
 */
export function maskText(text: string, privacyClass: PrivacyClass | undefined): string {
  if (privacyClass !== 'kisisel_veri' || !text) {
    return text;
  }

  return (
    text
      // Ad Soyad kalıbı (iki büyük harfle başlayan ardışık kelime)
      .replace(/\b([A-ZÇĞİÖŞÜ])[a-zçğıöşü]+\s+([A-ZÇĞİÖŞÜ])[a-zçğıöşü]+\b/g, '$1*** $2***')
      // TCKN
      .replace(/\b\d{11}\b/g, '***********')
      // IBAN
      .replace(/\bTR\d{2}[\dA-Z ]{10,}\b/gi, 'TR** **** **** ****')
  );
}

export function maskQuestion<T extends Question>(question: T): T {
  return {
    ...question,
    text: maskText(question.text, question.privacy_class),
    masked: question.privacy_class === 'kisisel_veri'
  };
}

export function maskArticle<T extends Article>(article: T): T {
  return {
    ...article,
    title: maskText(article.title, article.privacy_class),
    content: maskText(article.content, article.privacy_class),
    masked: article.privacy_class === 'kisisel_veri'
  };
}

export function maskAnswer<T extends Answer>(answer: T, privacyClass: PrivacyClass | undefined): T {
  return {
    ...answer,
    text: maskText(answer.text, privacyClass),
    masked: privacyClass === 'kisisel_veri'
  };
}

/* ═══ Şirkete özel içerik erişimi — Ç8 / 04-kvkk-guvenlik.md §5 ═══════════ */

/**
 * Çoklu müşteri temsilcisi alanı, eski `mt_id` ile geriye uyumlu çalışır;
 * tohumdaki yeni `mt_ids` dağılımı kaybolmaz.
 */
export function companyMtIds(company: Company): string[] {
  const seeded = seedCompanies.find(entry => entry.id === company.id);

  return company.mt_ids ?? seeded?.mt_ids ?? (company.mt_id ? [company.mt_id] : []);
}

/**
 * Şirket KAYDI ve şirket sayfası herkese açıktır; şirkete ÖZEL içerik değildir.
 * Erişim şirketin atanmış ekibiyle sınırlı:
 *   · şirketin `mt_ids` listesindeki Müşteri Temsilcileri
 *   · şirketin `ogy_id`'si (Operasyon Genel Yöneticisi)
 *   · Bilgi Uzmanı ve Admin (muaf — cevaplayan/onaylayan taraf oldukları için
 *     kısıtlanırlarsa eskalasyon havuzu hiç çalışmaz)
 */
export function hasCompanyAccess(store: MockStore, user: KnowledgeUser | null, companyId: string | null): boolean {
  if (!companyId) {
    return true; // şirketsiz genel içerik
  }
  if (!user) {
    return false;
  }
  if (user.role === 'bilgi_uzmani' || user.role === 'admin') {
    return true;
  }

  const company = store.companies.find(entry => entry.id === companyId);
  if (!company) {
    return false;
  }

  return companyMtIds(company).includes(user.id) || company.ogy_id === user.id;
}

/** Bir sorunun görünürlüğü — gizlilik sınıfı + atama birlikte karar verir. */
export function isQuestionVisible(store: MockStore, user: KnowledgeUser | null, question: Question | null): boolean {
  if (!question) {
    return false;
  }
  // Soruyu soran kişi kendi sorusunu her durumda görür.
  if (user && question.asker_id === user.id) {
    return true;
  }
  if (!question.company_id || question.privacy_class === 'genel') {
    return true;
  }

  return hasCompanyAccess(store, user, question.company_id);
}
