/**
 * Bilgi Bankası veri modeli — `Tanıtım/03-veri-modeli-ve-mimari.md` §2 ile birebir.
 *
 * Alan adları ve endpoint yolları İngilizce — sözleşme İngilizce sabitlendi.
 * Türkçe kalan tek şey enum DEĞERLERİ (`durum: 'eskale_edildi'`, `rol: 'admin'`);
 * eski Türkçe wire formatı: `Tanıtım/13-api-sozlesmesi.md`.
 */

/* ═══ Ortak birleşimler ══════════════════════════════════════════════════ */

export type KnowledgeRole = 'operasyon' | 'bilgi_uzmani' | 'admin';

/** 04-KVKK §3 — gizlilik sınıfları. `kisisel_veri` maskeleme tetikler. */
export type PrivacyClass = 'genel' | 'sirkete_ozel' | 'kisisel_veri';

/**
 * V43: soruda `acik` ara durumu yok. Kayıt oluşur oluşmaz ya Dasi cevaplar
 * (`otomatik_cevaplandi`) ya da ortak havuza düşer (`eskale_edildi`).
 */
export type QuestionStatus = 'otomatik_cevaplandi' | 'cozuldu' | 'eskale_edildi';

export type AnswerType = 'otomatik' | 'uzman' | 'derin_arastirma';

export type AnswerRating = 'yeterli' | 'yetersiz';

export type LegislationSourceKind = 'resmi' | 'kurum_duyurusu' | 'ictihat' | 'ozel_kaynak';

export type FlagTargetKind = 'cevap' | 'kb_kaydi' | 'soru';

/* ═══ Çekirdek kayıtlar ══════════════════════════════════════════════════ */

export interface KnowledgeUser {
  id: string;
  name: string;
  email: string;
  role: KnowledgeRole;
  team: string;
  active: boolean;
}

export interface Company {
  id: string;
  name: string;
  /** Tek MT alanı geriye uyumluluk için duruyor; kaynak `mt_ids`. */
  mt_id?: string | null;
  mt_ids?: string[];
  ogy_id?: string | null;
  status: string;
}

/**
 * `GET /companies` satırı: şirket kaydının üstüne erişim ve hacim alanları biner.
 * Ç8 — `access: false` satırda hacim rakamlarının daraldığını da bildirir.
 */
export interface CompanyListItem extends Company {
  access: boolean;
  mts: KnowledgeUser[];
  mt: KnowledgeUser | null;
  ogy: KnowledgeUser | null;
  question_count: number;
  solved_count: number;
  know_how_count: number;
  kb_count: number;
  last_activity: string | null;
}

export interface Tag {
  id: string;
  name: string;
  category: string;
  status: 'aktif' | 'pasif';
  /** Türetilen: soru + KB kaydı kullanım sayısı. */
  usage?: number;
  /** Yalnızca `suggestTags` yanıtında: sözlük eşleşme skoru. */
  score?: number;
}

export interface LegislationSource {
  id: string;
  name: string;
  url: string;
  section: string;
  kind: LegislationSourceKind;
  priority: number;
  update_frequency: string;
  active: boolean;
}

export interface LegislationContent {
  id: string;
  source_id: string;
  title: string;
  content: string;
  url: string;
  image_url?: string;
  accessed_at: string;
  revised_at: string;
  version: string;
  status: string;
}

/** Mevzuat içeriği + bağlı olduğu kaynak sitesi (ekranlar "SGK · …" gösterebilsin). */
export interface LegislationContentWithSource extends LegislationContent {
  source: LegislationSource | null;
}

export interface ArticleVersion {
  date: string;
  updated_by: string | null;
  title: string;
  content: string;
}

/**
 * Bilgi Bankası kaydı. V25: kaynağa dayalı GENEL bilgi tutar — şirkete özel
 * içerik girmez. V44: onay kademesi yok, her kayıt yayındadır.
 */
export interface Article {
  id: string;
  title: string;
  content: string;
  source_question_id?: string | null;
  /** Kaydın doğduğu uzman cevabı — V44'te KB kaydı doğrudan cevaptan üretilir. */
  source_answer_id?: string | null;
  source_legislation_id?: string | null;
  company_id?: string | null;
  tag_id: string[];
  verified: boolean;
  date: string;
  updated_at?: string;
  privacy_class: PrivacyClass;
  /** Kaydın kökeni: uzman cevabından mı, mevzuat taramasından mı doğdu. */
  source_kind?: 'uzman_girdisi' | 'mevzuat_taramasi';
  version_history?: ArticleVersion[];
  /** Maskeleme uygulandı mı — UI "maskelenmiştir" notunu buna göre gösterir. */
  masked?: boolean;
}

/** Liste yanıtı: kaydın üstüne çözülmüş ilişkiler biner. */
export interface ArticleListItem extends Article {
  tags: Tag[];
  company: Company | null;
  source_legislation: LegislationContentWithSource | null;
  flag_count: number;
}

export interface Question {
  id: string;
  text: string;
  asker_id: string;
  company_id: string | null;
  tag_id: string[];
  status: QuestionStatus;
  created_at: string;
  escalated_at?: string | null;
  solved_at?: string | null;
  /** Cevabından Bilgi Bankası kaydı üretildiyse o kaydın id'si (V44). */
  kb_article_id?: string | null;
  privacy_class: PrivacyClass;
  masked?: boolean;
}

export interface Answer {
  id: string;
  question_id: string;
  kind: AnswerType;
  text: string;
  answered_by: string | null;
  references: string[];
  attachments: string[];
  verified: boolean;
  verified_by: string | null;
  created_at: string;
  /** 03 §3: doğrulanmış kaynak bulunamadı — cevap değil, kaydın gerekçesi. */
  not_found?: boolean;
  rating?: AnswerRating;
  verified_at?: string;
  masked?: boolean;
}

export interface AnswerWithFeedback extends Answer {
  feedback: Feedback[];
}

/**
 * `GET /questions` satırı: sorunun üstüne cevap ve rapor sayaçları biner.
 *
 * V41: "kayıt bulunamadı" otomatik denemesi bir CEVAP değildir — sorunun havuza
 * neden düştüğünün kaydıdır. Listeler bu ikisini ayırt edebilsin diye ayrı
 * sayılıyor, aksi hâlde "Uzman bekliyor · 1 cevap" çelişkisi doğuyor.
 */
export interface QuestionListItem extends Question {
  answer_count: number;
  expert_answer_count: number;
  /** `not_found` işaretli olmayan cevaplar. */
  real_answer_count: number;
  /** Sonuçsuz otomatik tarama sayısı. */
  attempt_count: number;
  flag_count: number;
}

/** `GET /questions/:id` — soru + kronolojik cevapları. */
export interface QuestionDetail extends Question {
  answers: AnswerWithFeedback[];
}

/** `POST /questions` yanıtı: `escalated_to_expert`, eşleşme bulunamadığını bildirir. */
export interface QuestionCreated extends Question {
  answers: Answer[];
  escalated_to_expert: boolean;
}

/**
 * `GET /pool` satırı: eskalasyon havuzunda bekleyen soru + uzmanın devralmak
 * için ihtiyaç duyduğu bağlam (soran, şirket, bekleme süresi, önceki denemeler).
 */
export interface EscalationPoolItem extends Question {
  asker: KnowledgeUser | null;
  company: Company | null;
  /** Havuzda geçen saat — sıralama bu alana göre (en uzun bekleyen üstte). */
  waiting_hours: number | null;
  previous_answers: Answer[];
}

/**
 * Raporlanan içeriğin gövdesi.
 *
 * Raporlanan İçerikler ekranı hem "İçeriği görüntüle" modalında hem de KB
 * güncelleme formunda kaydın kendisini gösteriyor; ayrı bir istek atmak yerine
 * satıra biniyor. Hedef silinmiş/birleştirilmişse `null` döner.
 */
export interface FlagTarget {
  id: string;
  kind: FlagTargetKind;
  /** KB kaydının başlığı; cevap/soru raporlarında sorunun metni. */
  title: string;
  /** KB kaydının içeriği veya cevabın metni. Soruda gövde yoktur, metin başlıkta. */
  body?: string;
  /** Cevap raporlarında cevabın bağlı olduğu soru — "Soruyu aç" bağlantısı için. */
  question?: { id: string; text: string } | null;
}

/** `GET /flags` satırı: raporun hedefi ve tarafları çözülmüş hâli. */
export interface FlagListItem extends Flag {
  target_title: string;
  target: FlagTarget | null;
  reporter: KnowledgeUser | null;
  updater: KnowledgeUser | null;
  replier: KnowledgeUser | null;
}

/** `GET /users` satırı — hacim alanları türetilir. */
export interface UserListItem extends KnowledgeUser {
  question_count: number;
  answer_count: number;
  mt_of_companies: string[];
}

/** `GET /feedback` — bir hedefin onay/red özeti + kullanıcının kendi işareti. */
export interface FeedbackSummary {
  approvals: number;
  rejections: number;
  mine: 'onay' | 'red' | null;
}

export interface Feedback {
  id: string;
  target_kind: FlagTargetKind;
  target_id: string;
  user_id: string;
  value: 'onay' | 'red';
  date: string;
}

export interface Flag {
  id: string;
  target_kind: FlagTargetKind;
  target_id: string;
  reporter_id: string;
  reason: string;
  status: 'acik' | 'inceleniyor' | 'kapandi';
  updated_by: string | null;
  date: string;
  outcome?: string;
  description?: string;
  updated_at?: string;
  source_url?: string;
  source_title?: string;
  /** Uzmanın raporu kapatırken bildiren kişiye yazdığı yanıt. */
  expert_reply?: string;
  replied_by?: string;
  reply_source?: { url: string; title: string };
  /** Bildiren kişinin uzman yanıtına verdiği geri dönüş. */
  reporter_ack?: 'bekliyor' | 'anladi' | 'katilmiyor';
  /** 05 §5: PII/maskeleme gerekçeli raporlar öncelikli sıraya girer. */
  priority?: boolean;
}

/** Operasyon notu (know-how) — tanımı gereği şirkete özel. */
export interface Note {
  id: string;
  company_id: string;
  text: string;
  author_id: string;
  status: string;
  date?: string;
}

/**
 * Bilgi Bankası dökümanı — yüklenen belge kaydı.
 *
 * NEDEN AYRI KOLEKSİYON (belge ≠ KB kaydı): KB kaydı yazılmış, düzenlenebilir
 * bir metindir; belgenin dosya kimliği vardır (ad, tür, boyut) ve içeriği
 * düzenlenmez. İkisini tek tipte birleştirmek her iki tarafta da yarısı boş
 * alanlar bırakırdı.
 *
 * V25 gereği GENEL: şirkete bağlanmaz, bu yüzden Ç8 erişim kapısı yoktur.
 * Şirkete özel belge ihtiyacı doğarsa ayrı bir koleksiyon olarak gelmeli.
 */
export interface KnowledgeDocument {
  id: string;
  /** Görünen ad — varsayılanı dosya adı, uzman değiştirebilir. */
  name: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  tag_id: string[];
  uploaded_by: string | null;
  uploaded_at: string;
  /**
   * Çıkarılmış metin. 03 §3 / Vizyon İlke #1: Dasi YALNIZCA bu alanı okur —
   * metni olmayan belge cevaplarda kaynak olarak kullanılmaz.
   */
  extracted_text?: string;
  /** Türetilen: metni var mı. Listede "İndekslenmedi" rozetini bu belirler. */
  indexed: boolean;
}

/** `GET /kb-documents` satırı: belgenin üstüne çözülmüş ilişkiler biner. */
export interface KnowledgeDocumentListItem extends KnowledgeDocument {
  tags: Tag[];
  uploader: KnowledgeUser | null;
  /**
   * Bu oturumda yüklendiyse gerçek dosya önizlenebilir/indirilebilir.
   * Kalıcı dosya deposu (S3/Blob) olmadığı için önceki oturumların belgelerinde
   * ve tohum veride `false` — kullanıcı bunu ekranda görür.
   */
  previewable: boolean;
}

export interface CreateDocumentInput {
  name: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  tag_id?: string[];
  /** Düz metin türlerinde otomatik çıkarılır; PDF/Word'de uzman girer. */
  extracted_text?: string;
  /** Yalnızca oturum içi önizleme için; `sessionStorage`'a yazılmaz (kota). */
  data_url?: string;
}

/** `GET /know-how` satırı: notun üstüne şirket ve yazan çözülmüş biner. */
export interface NoteListItem extends Note {
  company: Company | null;
  author: KnowledgeUser | null;
}

export interface BulletinEntry {
  id: string;
  date: string;
  summary: string;
  cover_image_url?: string;
  related_legislation_content_id: string[];
  send_time: string;
}

/** `GET /bulletin` satırı: haftalık sayı + atıf verdiği mevzuat içerikleri. */
export interface BulletinListItem extends BulletinEntry {
  contents: LegislationContentWithSource[];
}

/* ═══ İstek parametreleri ════════════════════════════════════════════════ */

export interface CreateQuestionInput {
  text: string;
  company_id?: string | null;
  tag_id?: string[];
  privacy_class?: PrivacyClass;
  /**
   * V43: Dasi sohbetinde `true` (KB taraması yapılır), "Yeni Soru Sor"
   * formunda `false` — kayıt tarama yapılmadan doğrudan ortak havuza düşer.
   */
  auto_answer?: boolean;
}

export interface CreateFeedbackInput {
  target_kind: 'cevap' | 'kb_kaydi';
  target_id: string;
  value: 'onay' | 'red';
}

export interface CreateFlagInput {
  target_kind: FlagTargetKind;
  target_id: string;
  reason: string;
}

/**
 * `POST /flags/:id/update` — PRD §4.8 (V40): Açık → İnceleniyor → Kapandı.
 *
 * Kapanışta `outcome` ZORUNLU: raporun hangi kararla kapandığı durumun yerine
 * geçmez, yanında durur. `degisiklik_gerekmedi` kararında `description` bildiren
 * kişiye iletilen uzman yanıtı olur; kaynak alanları o yanıtın dayanağıdır.
 */
export interface UpdateFlagInput {
  status: 'acik' | 'inceleniyor' | 'kapandi';
  outcome?: 'guncellendi' | 'degisiklik_gerekmedi';
  description?: string;
  source_url?: string;
  source_title?: string;
}

/** `PATCH /kb-articles/:id` — 05 §6: önceki sürüm saklanır, kim değiştirdi izlenir. */
export interface UpdateArticleInput {
  title: string;
  content: string;
}

/** `POST /tags` — yeni etiket. Ad normalize edilir: küçük harf, boşluk → tire. */
export interface CreateTagInput {
  name: string;
  category?: string;
}

/**
 * `PUT /knowledge/labels/:id` — canlı backend yalnızca `name`'i tutuyor;
 * `category`/`status` mock kaynağa özgü (bkz. `api/adapters/http.ts`).
 */
export interface UpdateTagInput {
  name?: string;
  category?: string;
  status?: 'aktif' | 'pasif';
}

/** `POST /companies/:id/know-how` — şirkete özel operasyon notu ekler. */
export interface CreateNoteInput {
  text: string;
}

/**
 * `POST /companies/merge` — mükerrer şirket kaydını birleştirir.
 * RACI: yalnızca Admin. Geri alınamaz; kaynak kayıt silinir.
 */
export interface MergeCompaniesInput {
  source_id: string;
  target_id: string;
}

export interface MergeCompaniesResult {
  target: Company;
  /** Hedefe taşınan soru + not + KB kaydı sayısı. */
  moved_records: number;
  /** Silinen şirketin adı — bildirimde gösterilir. */
  deleted_name: string;
}

/** `POST /answers/:id/rate` yanıtı — soru durumu da döner. */
export interface RateAnswerResult {
  question: Question;
  answer: Answer;
}

export interface AnswerQuestionInput {
  text: string;
  /** Cevaba eklenen bağlantı/dosya referansları. */
  attachments?: string[];
}

/**
 * `POST /questions/:id/expert-answer` yanıtı.
 * PRD §4.3 / FR-5: uzman cevabı verified doğar ve soruyu `cozuldu`ya taşır.
 */
export interface AnswerQuestionResult {
  question: Question;
  answer: Answer;
}

/**
 * `POST /kb-articles` — uzman cevabını kalıcı bilgiye çevirir.
 *
 * V25: `privacy_class: 'sirkete_ozel'` reddedilir; Bilgi Bankası genel bilgi
 * tutar. V44: onay kademesi yok, kayıt doğrudan yayına girer.
 */
export interface CreateArticleInput {
  question_id?: string | null;
  answer_id?: string | null;
  title: string;
  content: string;
  tag_id?: string[];
  source_legislation_id?: string | null;
  privacy_class?: PrivacyClass;
}
