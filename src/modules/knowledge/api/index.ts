import * as http from './adapters/http';
import * as mock from './adapters/mock';

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  BİLGİ BANKASI'NIN TEK SERVİS KATMANI                                    ║
 * ║                                                                          ║
 * ║  Hiçbir ekran veri kaynağını bilmez; herkes buradan import eder. Mock'tan ║
 * ║  gerçek backend'e geçiş, `NEXT_PUBLIC_KNOWLEDGE_DATA_SOURCE=api` ile tek  ║
 * ║  noktadan yapılır — sayfa kodunda hiçbir değişiklik gerekmez.            ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * Fonksiyon ↔ endpoint eşlemesi: docs/knowledge-migration-plan.md §3
 */

const useHttp = process.env.NEXT_PUBLIC_KNOWLEDGE_DATA_SOURCE === 'api';

/**
 * UÇ NOKTA BAZINDA CANLIYA GEÇİŞ.
 *
 * Backend uç noktaları tek tek teslim ediyor. Tümünü birden çevirmek (yani
 * `NEXT_PUBLIC_KNOWLEDGE_DATA_SOURCE=api`) henüz yazılmamış uç noktalara
 * gitmek demek olduğu için, hazır olanlar burada isim isim açılır:
 *
 *   NEXT_PUBLIC_KNOWLEDGE_LIVE_ENDPOINTS=getTags,getCompanies
 *
 * Listede olmayan her fonksiyon mock'tan beslenmeye devam eder. Ekranlar bu
 * ayrımı görmez — kural bozulmuyor, yalnızca anahtar fonksiyon başına indi.
 * Bütün uç noktalar teslim edilince liste kalkar ve tek anahtar geri gelir.
 */
const liveEndpoints = new Set(
  (process.env.NEXT_PUBLIC_KNOWLEDGE_LIVE_ENDPOINTS ?? '')
    .split(',')
    .map(name => name.trim())
    .filter(Boolean)
);

type AdapterKey = keyof typeof mock & keyof typeof http;

function resolve<K extends AdapterKey>(name: K): (typeof mock)[K] {
  const live = useHttp || liveEndpoints.has(name);

  return (live ? http[name] : mock[name]) as (typeof mock)[K];
}

/**
 * Geriye uyumluluk: `adapter.*` biçiminde okunan fonksiyonlar için tek kaynak.
 * Yeni satırlar `resolve('fn')` kullanmalı ki canlı listesi onlara da işlesin.
 */
const adapter = useHttp ? http : mock;

/** Hangi veri kaynağının çalıştığı — geliştirici araçları bunu gösterir. */
export const KNOWLEDGE_DATA_SOURCE: 'api' | 'mock' = useHttp ? 'api' : 'mock';

/** Canlı uç noktaların adları — geliştirici araçları bunu gösterir. */
export const KNOWLEDGE_LIVE_ENDPOINTS: string[] = useHttp ? ['*'] : [...liveEndpoints];

/* ═══ Kimlik ═════════════════════════════════════════════════════════════ */

/** `GET /me` — oturum açan kullanıcı + rolü. */
export const getCurrentUser = adapter.getCurrentUser;

/** Geliştirici rol değiştiricisi (K4); yalnızca mock kaynağında çalışır. */
export const setCurrentUser = adapter.setCurrentUser;

/** Prototip verisini tohum hâline döndürür; yalnızca mock kaynağında çalışır. */
export const resetMockData = adapter.resetMockData;

/* ═══ Etiketler ══════════════════════════════════════════════════════════ */

/** `GET /knowledge/labels` — backend teslim etti; alan eşlemesi http adaptöründe. */
export const getTags = resolve('getTags');

/** `GET /knowledge/labels/:id` — tek etiket. */
export const getTag = resolve('getTag');

/** `POST /knowledge/labels` — yeni etiket; RACI: Bilgi Uzmanı + Admin. */
export const createTag = resolve('createTag');

/** `PUT /knowledge/labels/:id` — canlı kaynakta yalnızca ad güncellenir. */
export const updateTag = resolve('updateTag');

/** `DELETE /knowledge/labels/:id` — kalıcı silme; backend'de pasife alma yok. */
export const deleteTag = resolve('deleteTag');

/** `POST /tags/suggest` — soru gönderilmeden önce tag önerisi (FR-1). */
export const suggestTags = adapter.suggestTags;

/* ═══ Şirketler ══════════════════════════════════════════════════════════ */

/** `GET /companies` — satır başına `access: boolean` taşır (Ç8). */
export const getCompanies = adapter.getCompanies;

/** `POST /companies/merge` — mükerrer kaydı birleştirir; yalnızca Admin (RACI). */
export const mergeCompanies = adapter.mergeCompanies;

/* ═══ Bilgi Bankası ══════════════════════════════════════════════════════ */

/** `GET /kb-articles` */
export const getArticles = adapter.getArticles;

/* ═══ Bilgi Bankası dökümanları ══════════════════════════════════════════ */

/** `GET /knowledge/documents` — backend teslim etti; alan eşlemesi http adaptöründe. */
export const getDocuments = resolve('getDocuments');

/** `POST /knowledge/documents` — belge yükler; yetki Bilgi Uzmanı Havuzu'nda (RACI). */
export const createDocument = resolve('createDocument');

/** `DELETE /knowledge/documents/:id` — belgeyi kaldırır. */
export const deleteDocument = resolve('deleteDocument');

/** Oturum içi önizleme/indirme kaynağı; kalıcı depo gelene kadar geçici. */
export const getDocumentFileUrl = adapter.getDocumentFileUrl;

/* ═══ Sorular ════════════════════════════════════════════════════════════ */

/** `GET /questions` — filtreli soru listesi; satır başına cevap/rapor sayaçları. */
export const getQuestions = adapter.getQuestions;

/** `GET /questions/:id` — soru + kronolojik cevapları. */
export const getQuestion = adapter.getQuestion;

/** `POST /questions` — yeni soru; `auto_answer` true ise KB taraması tetiklenir. */
export const createQuestion = adapter.createQuestion;

/** `POST /answers/:id/rate` — yeterli/yetersiz; yetersiz ortak havuza düşürür. */
export const rateAnswer = adapter.rateAnswer;

/** `POST /answers/:id/verify` — Bilgi Uzmanı cevabı verified'a yükseltir (FR-7). */
export const verifyAnswer = adapter.verifyAnswer;

/* ═══ Eskalasyon havuzu ══════════════════════════════════════════════════ */

/** `GET /pool` — uzman yanıtı bekleyen sorular; havuz kişiye atanmaz (PRD §4.3). */
export const getEscalationPool = adapter.getEscalationPool;

/** `POST /questions/:id/expert-answer` — uzman cevabı; verified doğar (FR-5). */
export const answerQuestion = adapter.answerQuestion;

/** `POST /kb-articles` — uzman cevabını kalıcı bilgiye çevirir (V44). */
export const createArticle = adapter.createArticle;

/* ═══ Kullanıcılar ═══════════════════════════════════════════════════════ */

/** `GET /users` */
export const getUsers = adapter.getUsers;

/* ═══ Operasyon notları (know-how) ═══════════════════════════════════════ */

/** `GET /know-how` — çapraz not listesi; Ç8 erişim kapısından geçer. */
export const getNotes = adapter.getNotes;

/** `POST /companies/:id/know-how` — şirkete özel operasyon notu ekler. */
export const createNote = adapter.createNote;

/* ═══ Geribildirim ve raporlama ══════════════════════════════════════════ */

/** `POST /feedback` — onay/red işareti; aynı kullanıcının işaretini günceller. */
export const createFeedback = adapter.createFeedback;

/** `GET /feedback` — hedefin onay/red özeti + kullanıcının kendi işareti. */
export const getFeedbackSummary = adapter.getFeedbackSummary;

/** `POST /flag` — içerik raporu; Bilgi Uzmanı havuzuna gider, kişiye değil. */
export const createFlag = adapter.createFlag;

/** `GET /flag` — açık/kapalı içerik raporları; PII gerekçeliler öncelikli sırada. */
export const getFlags = adapter.getFlags;

/** `POST /flags/:id/update` — Açık → İnceleniyor → Kapandı (PRD §4.8). */
export const updateFlag = adapter.updateFlag;

/** `PATCH /kb-articles/:id` — raporla gelen düzeltme; önceki sürüm saklanır (05 §6). */
export const updateArticle = adapter.updateArticle;

/* ═══ Bülten ═════════════════════════════════════════════════════════════ */

/** `GET /bulletin` — haftalık mevzuat bülteni sayıları + atıf verdiği içerikler. */
export const getBulletins = adapter.getBulletins;
