import { paths } from 'src/paths';

import type { PrivacyClass } from './types';

/**
 * Bilgi Bankası sabitleri — prototipin `config.js` karşılığı.
 * Kullanıcıya görünen metinler i18n'den gelir; buradaki `labelKey` alanları
 * `knowledge.*` anahtarlarına işaret eder.
 */

export const KNOWLEDGE_APP = {
  assistantName: 'Dasi',
  /** PRD §4.7 — bülten haftalık yayımlanır: her Pazartesi 09:00. */
  bulletinDay: 1,
  bulletinHour: '09:00'
} as const;

/* ═══ Etiket taksonomisi — PRD §7 / 09 §3 ════════════════════════════════ */

/**
 * Kategoriler sabit bir taksonomi: serbest metin olsaydı aynı kavram için
 * "surec", "süreç", "process" üçü birden oluşur ve otomatik cevap eşleştirmesi
 * bozulurdu. Etiketin KENDİSİ serbest, kategorisi listeden.
 */
export const TAG_CATEGORIES = [
  { id: 'mevzuat', labelKey: 'knowledge.tags.category.mevzuat' },
  { id: 'urun', labelKey: 'knowledge.tags.category.urun' },
  { id: 'surec', labelKey: 'knowledge.tags.category.surec' },
  { id: 'destek', labelKey: 'knowledge.tags.category.destek' }
] as const;

/** Prototipin `postEtiket` normalizasyonu: küçük harf + boşluk → tire. */
export function normalizeTagName(name: string): string {
  return name.trim().toLocaleLowerCase('tr-TR').replace(/\s+/g, '-');
}

/* ═══ Bilgi Bankası döküman yükleme kuralları ════════════════════════════ */

/**
 * Kabul edilen türler ve boyut sınırı tek yerde: `accept` niteliği, istemci
 * doğrulaması ve hata mesajı aynı listeden besleniyor — üçü ayrışırsa
 * kullanıcı "kabul edildi" görüp sonra reddedilir.
 */
export const KB_DOCUMENT_RULES = {
  maxBytes: 10 * 1024 * 1024,
  extensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'md', 'csv'] as const,
  /**
   * V42 kuralı: metin çıkarımı yalnızca düz metin türlerinde otomatik.
   * PDF/Word'de metin alanı uzmana bırakılır; boş bırakılırsa belge yüklenir
   * ama indekslenmez ve Dasi onu kaynak olarak kullanmaz (03 §3).
   */
  textExtractable: ['txt', 'md', 'csv'] as const
} as const;

/**
 * `file-storage-service` üzerinde belgelerin yazıldığı klasör adı.
 * Backend `fileFolder` alanını bu servise olduğu gibi geçiriyor.
 */
export const KB_DOCUMENT_FOLDER = 'knowledge-documents';

/** `<input accept>` değeri — uzantı listesinden türetilir, elle yazılmaz. */
export const KB_DOCUMENT_ACCEPT = KB_DOCUMENT_RULES.extensions.map(ext => `.${ext}`).join(',');

export function documentExtension(fileName: string): string {
  const parts = fileName.toLowerCase().split('.');

  return parts.length > 1 ? (parts.pop() ?? '') : '';
}

/* ═══ Eskalasyon SLA eşikleri — 07 §3 ════════════════════════════════════ */

/**
 * Havuz bir nöbet ekranıdır: kayıt kimseye atanmadığı için "en uzun bekleyen"
 * kararı ekranın kendisinden okunmalı. Eşikler tek yerde durur ki pano, kart
 * ve modal aynı rakamı göstersin.
 */
export const ESCALATION_SLA = {
  /** Hedef: uzman cevabı ilk 24 saatte gelir. */
  targetHours: 24,
  /** Kritik aşım: 48 saati geçen kayıt. */
  breachHours: 48
} as const;

/* ═══ Gizlilik sınıfları — 04-KVKK §3 ════════════════════════════════════ */

export interface PrivacyClassOption {
  id: PrivacyClass;
  labelKey: string;
  descriptionKey: string;
}

export const PRIVACY_CLASSES: PrivacyClassOption[] = [
  { id: 'genel', labelKey: 'knowledge.privacy.genel', descriptionKey: 'knowledge.privacy.genelHint' },
  {
    id: 'sirkete_ozel',
    labelKey: 'knowledge.privacy.sirketeOzel',
    descriptionKey: 'knowledge.privacy.sirketeOzelHint'
  },
  {
    id: 'kisisel_veri',
    labelKey: 'knowledge.privacy.kisiselVeri',
    descriptionKey: 'knowledge.privacy.kisiselVeriHint'
  }
];

/* ═══ Karşılama ekranı keşif bağlantıları ════════════════════════════════ */

export const DISCOVER_LINKS = [
  { key: 'articles', labelKey: 'knowledge.discover.articles', href: paths.knowledgeArticles, icon: 'bookOpen' },
  { key: 'bulletin', labelKey: 'knowledge.discover.bulletin', href: paths.knowledgeBulletin, icon: 'receipt' }
] as const;

/* ═══ Dasi durum makinesi — 14-dasi-etkilesim-sistemi.md §2 ve §6 ═════════ */

export type DasiState =
  'idle' | 'welcome' | 'listening' | 'thinking' | 'answering' | 'success' | 'not-found' | 'expert-help' | 'error';

export interface DasiAsset {
  /**
   * Statik PNG. Her zaman zorunlu: video'nun poster'ı, video yoksa gösterilen
   * hâli, `prefers-reduced-motion` açıkken de bu kullanılır. Tek seferlik
   * animasyon bittiğinde de buna dönülür — son karede donup kalmaz.
   */
  image: string;
  /** Opsiyonel; dosya yoksa veya açılamazsa sessizce `image`'a düşülür. */
  video?: string;
  /**
   * `'black'`: videonun zemini siyah kaydedilmiş, çalışma anında taşma
   * dolgusuyla saydamlaştırılır. Alpha kanallı sürüm geldiğinde kaldırılmalı.
   */
  chroma?: 'black';
  /** `true`: sürekli loop (idle/listening/thinking — 14 §3). */
  loop?: boolean;
  /** Durum yazısı i18n anahtarı; `null` ise yazı gizlenir. */
  messageKey: string | null;
}

const DASI_DIR = '/assets/dasi';

/**
 * Asset tablosu TEK YERDE: yeni animasyonlar geldiğinde yalnızca bu tablo değişir.
 *
 * `idle`/`welcome`/`listening` aynı dosyayı paylaşıyor — bunlar Dasi'nin nötr
 * bekleme hâlleri. Aynı kaynağı göstermelerinin ikinci faydası: medya katmanı
 * aynı kaynağı görünce videoyu yeniden kurmuyor, açılıştaki idle→welcome→listening
 * zinciri loop'u baştan başlatmadan kesintisiz akıyor.
 */
export const DASI_ASSETS: Record<DasiState, DasiAsset> = {
  idle: {
    image: `${DASI_DIR}/dasi-genel.png`,
    video: `${DASI_DIR}/dasi-idle.mp4`,
    loop: true,
    chroma: 'black',
    messageKey: null
  },
  welcome: {
    image: `${DASI_DIR}/dasi-genel.png`,
    video: `${DASI_DIR}/dasi-idle.mp4`,
    loop: true,
    chroma: 'black',
    messageKey: 'knowledge.dasi.state.welcome'
  },
  listening: {
    image: `${DASI_DIR}/dasi-genel.png`,
    video: `${DASI_DIR}/dasi-idle.mp4`,
    loop: true,
    chroma: 'black',
    messageKey: null
  },
  thinking: {
    image: `${DASI_DIR}/dasi-genel.png`,
    video: `${DASI_DIR}/dasi-thinking.mp4`,
    loop: true,
    chroma: 'black',
    messageKey: 'knowledge.dasi.state.thinking'
  },
  // loop YOK: 14 §3 gereği answering tek seferlik geçiş animasyonu.
  answering: {
    image: `${DASI_DIR}/dasi-genel.png`,
    video: `${DASI_DIR}/dasi-answering.mp4`,
    chroma: 'black',
    messageKey: null
  },
  success: {
    image: `${DASI_DIR}/dasi-genel.png`,
    video: `${DASI_DIR}/dasi-success.mp4`,
    chroma: 'black',
    messageKey: 'knowledge.dasi.state.success'
  },
  'not-found': {
    image: `${DASI_DIR}/dasi-genel.png`,
    messageKey: 'knowledge.dasi.state.notFound'
  },
  // loop AÇIK: yönlendirme işlenirken "yazıyor" göstergesinde gösteriliyor,
  // süre değişken olabildiği için loop gerekiyor.
  'expert-help': {
    image: `${DASI_DIR}/dasi-genel.png`,
    video: `${DASI_DIR}/dasi-expert-help.mp4`,
    loop: true,
    chroma: 'black',
    messageKey: 'knowledge.dasi.state.expertHelp'
  },
  error: {
    image: `${DASI_DIR}/dasi-error.png`,
    video: `${DASI_DIR}/dasi-error.mp4`,
    chroma: 'black',
    messageKey: 'knowledge.dasi.state.error'
  }
};

/** Geçerli geçişler — 14 §5. Tanımsız geçiş uygulanır ama konsola yazılır. */
export const DASI_TRANSITIONS: Record<DasiState, DasiState[]> = {
  idle: ['welcome', 'listening', 'thinking', 'error'],
  welcome: ['listening', 'idle', 'thinking'],
  listening: ['thinking', 'idle', 'error'],
  thinking: ['answering', 'not-found', 'error'],
  answering: ['success', 'listening', 'idle', 'thinking', 'expert-help'],
  success: ['listening', 'idle'],
  'not-found': ['expert-help', 'listening', 'idle'],
  'expert-help': ['idle', 'listening', 'success'],
  error: ['listening', 'idle', 'thinking']
};

/** Hero yalnızca "Dasi burada" hissini veren nötr loop'u oynatır (14 §3). */
export const DASI_HERO_VIDEO_STATES: DasiState[] = ['idle', 'welcome', 'listening'];
