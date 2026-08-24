import { KB_DOCUMENT_RULES, documentExtension, normalizeTagName } from 'src/modules/knowledge/constants';
import { seedStopWords, seedTagDictionary } from 'src/modules/knowledge/mocks/seed-data';
import type {
  Answer,
  AnswerQuestionInput,
  AnswerQuestionResult,
  AnswerWithFeedback,
  Article,
  ArticleListItem,
  BulletinListItem,
  CompanyListItem,
  CreateArticleInput,
  CreateDocumentInput,
  CreateFeedbackInput,
  CreateFlagInput,
  CreateNoteInput,
  CreateQuestionInput,
  CreateTagInput,
  EscalationPoolItem,
  Feedback,
  FeedbackSummary,
  Flag,
  FlagListItem,
  FlagTarget,
  KnowledgeDocument,
  KnowledgeDocumentListItem,
  KnowledgeUser,
  LegislationContentWithSource,
  MergeCompaniesInput,
  MergeCompaniesResult,
  Note,
  NoteListItem,
  Question,
  QuestionCreated,
  QuestionDetail,
  QuestionListItem,
  RateAnswerResult,
  Tag,
  UpdateArticleInput,
  UpdateFlagInput,
  UpdateTagInput,
  UserListItem
} from 'src/modules/knowledge/types';

import { hasCompanyAccess, isQuestionVisible, maskAnswer, maskArticle, maskQuestion, maskText } from './access';
import { companyMtIds } from './access';
import { type MockStore, persist, readSessionUserId, resetStore, store, writeSessionUserId } from './store';

/**
 * Mock adaptörü — prototipin `api-client.js` gövdelerinin karşılığı.
 * Fonksiyon adları, parametreleri ve dönen veri şekli http adaptörüyle aynıdır;
 * ekranlar hangisinin çalıştığını bilmez.
 */

/* ═══ Yardımcılar ════════════════════════════════════════════════════════ */

const delay = (ms = 120) => new Promise<void>(resolve => setTimeout(resolve, ms));

function newId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  return `${prefix}_${random}`;
}

const now = () => new Date().toISOString().slice(0, 19);

/** V8: tarih-only kayıtlarda saat 09:00 varsayılır. */
function timeOf(value?: string | null): number {
  if (!value) {
    return 0;
  }

  return new Date(value.length <= 10 ? `${value}T09:00:00` : value).getTime();
}

const trLower = (value?: string) => (value ?? '').toLocaleLowerCase('tr-TR');

/* ═══ Kimlik — 13 §5 ═════════════════════════════════════════════════════ */

export async function getCurrentUser(): Promise<KnowledgeUser> {
  await delay(40);
  const state = store();
  const id = readSessionUserId();

  /**
   * Varsayılan: geliştiricinin kendi kaydı (id 37, Bilgi Uzmanı). Önceden u5
   * (Admin) idi; admin bir çok ekranı salt görüntülediği için belge yükleme,
   * eskalasyon cevaplama ve rapor inceleme akışları varsayılan açılışta
   * kapalı görünüyordu. Rolü sınamak için `setCurrentUser` hâlâ var (K4).
   */
  return (
    state.users.find(user => user.id === id) ??
    state.users.find(user => user.id === '37') ??
    state.users.find(user => user.id === 'u5') ??
    state.users[0]
  );
}

/** Geliştirici rol değiştiricisi (K4). Gerçek rol kaynağı geldiğinde kalkar. */
export async function setCurrentUser(userId: string): Promise<KnowledgeUser> {
  const state = store();
  const user = state.users.find(entry => entry.id === userId);
  if (!user) {
    throw new Error(`Kullanıcı bulunamadı: ${userId}`);
  }
  writeSessionUserId(userId);

  return user;
}

export async function resetMockData(): Promise<{ ok: true }> {
  resetStore();

  return { ok: true };
}

/* ═══ Etiketler ══════════════════════════════════════════════════════════ */

export async function getTags({ status, category }: { status?: string; category?: string } = {}): Promise<Tag[]> {
  await delay(60);
  const state = store();

  return state.tags
    .filter(tag => (!status || tag.status === status) && (!category || tag.category === category))
    .map(tag => ({
      ...tag,
      usage:
        state.questions.filter(question => question.tag_id.includes(tag.id)).length +
        state.articles.filter(article => (article.tag_id ?? []).includes(tag.id)).length
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
}

/** `GET /knowledge/labels/:id` — tek etiket. */
export async function getTag(tagId: string): Promise<Tag> {
  await delay(60);
  const tag = store().tags.find(entry => entry.id === tagId);
  if (!tag) {
    throw new Error(`Etiket bulunamadı: ${tagId}`);
  }

  return tag;
}

/**
 * `POST /knowledge/labels` — yeni etiket.
 * RACI: tag taksonomisi yönetimi Bilgi Uzmanı Havuzu R/A, Admin C — ikisi de yazar.
 */
export async function createTag({ name, category = 'mevzuat' }: CreateTagInput): Promise<Tag> {
  if (!name?.trim()) {
    throw new Error('Etiket adı boş olamaz.');
  }
  await delay(150);
  const state = store();
  const user = await getCurrentUser();
  if (!['admin', 'bilgi_uzmani'].includes(user.role)) {
    throw new Error('Tag taksonomisi yönetimi Bilgi Uzmanı Havuzu ve Admin yetkisindedir (RACI).');
  }

  const normalized = normalizeTagName(name);
  if (state.tags.some(tag => tag.name === normalized)) {
    throw new Error(`Bu etiket zaten var: ${normalized}`);
  }

  const tag: Tag = { id: newId('t'), name: normalized, category, status: 'aktif' };
  state.tags.push(tag);
  persist();

  return tag;
}

/**
 * `PUT /knowledge/labels/:id` — ad/kategori/durum güncellemesi.
 *
 * Mock kaynak kategori ve durumu da tutar; canlı backend yalnızca adı tutuyor
 * (bkz. `adapters/http.ts`). Fark ekranda söyleniyor, saklanmıyor.
 */
export async function updateTag(tagId: string, { name, category, status }: UpdateTagInput): Promise<Tag> {
  await delay(150);
  const state = store();
  const user = await getCurrentUser();
  if (!['admin', 'bilgi_uzmani'].includes(user.role)) {
    throw new Error('Tag taksonomisi yönetimi Bilgi Uzmanı Havuzu ve Admin yetkisindedir (RACI).');
  }
  const tag = state.tags.find(entry => entry.id === tagId);
  if (!tag) {
    throw new Error(`Etiket bulunamadı: ${tagId}`);
  }

  if (name?.trim()) {
    const normalized = normalizeTagName(name);
    if (state.tags.some(entry => entry.id !== tagId && entry.name === normalized)) {
      throw new Error(`Bu etiket zaten var: ${normalized}`);
    }
    tag.name = normalized;
  }
  if (category) {
    tag.category = category;
  }
  if (status) {
    tag.status = status;
  }
  persist();

  return tag;
}

/**
 * `DELETE /knowledge/labels/:id` — kalıcı silme.
 *
 * 09 §3 kullanımdaki etiketin pasife alınmasını, silinmemesini söylüyor; canlı
 * backend'de `status` alanı olmadığı için tek yazma aksiyonu silme kaldı ve bu
 * fonksiyon o davranışın mock karşılığı. Silinen etiketin kimliği soru ve KB
 * kayıtlarından da düşürülür — aksi hâlde ekranlar var olmayan bir etikete
 * bakan ölü referansla kalırdı.
 */
export async function deleteTag(tagId: string): Promise<{ ok: true }> {
  await delay(150);
  const state = store();
  const user = await getCurrentUser();
  if (!['admin', 'bilgi_uzmani'].includes(user.role)) {
    throw new Error('Tag taksonomisi yönetimi Bilgi Uzmanı Havuzu ve Admin yetkisindedir (RACI).');
  }
  const index = state.tags.findIndex(entry => entry.id === tagId);
  if (index === -1) {
    throw new Error(`Etiket bulunamadı: ${tagId}`);
  }

  state.tags.splice(index, 1);
  for (const question of state.questions) {
    question.tag_id = question.tag_id.filter(id => id !== tagId);
  }
  for (const article of state.articles) {
    article.tag_id = (article.tag_id ?? []).filter(id => id !== tagId);
  }
  for (const document of state.documents) {
    document.tag_id = (document.tag_id ?? []).filter(id => id !== tagId);
  }
  persist();

  return { ok: true };
}

/** Tag önerisi — FR-1. Motor servis katmanında durur, UI'da değil (03 §4). */
export async function suggestTags({ text }: { text: string }): Promise<Tag[]> {
  await delay(160);
  const state = store();
  if (!text?.trim()) {
    return [];
  }

  const haystack = trLower(text);
  const scored: Tag[] = [];

  for (const [tagId, keywords] of Object.entries(seedTagDictionary)) {
    const tag = state.tags.find(entry => entry.id === tagId && entry.status === 'aktif');
    if (!tag) {
      continue;
    }

    let score = 0;
    for (const keyword of keywords) {
      if (haystack.includes(trLower(keyword))) {
        score += 1;
      }
    }

    if (score > 0) {
      scored.push({ ...tag, score: score });
    }
  }

  return scored.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 4);
}

/* ═══ Şirketler ══════════════════════════════════════════════════════════ */

export async function getCompanies({ status }: { status?: string } = {}): Promise<CompanyListItem[]> {
  await delay(80);
  const state = store();
  const user = await getCurrentUser();

  return state.companies
    .filter(company => !status || company.status === status)
    .map(company => {
      // Ç8: şirket KAYDI herkese görünür, hacim rakamları erişime göre daralır —
      // görülemeyen içerik sayaçta da sayılmaz (aksi hâlde hacim sızar).
      const access = hasCompanyAccess(state, user, company.id);
      const questions = state.questions.filter(
        question => question.company_id === company.id && isQuestionVisible(state, user, question)
      );
      const notes = access ? state.notes.filter(note => note.company_id === company.id) : [];
      const mtIds = companyMtIds(company);
      const questionIds = new Set(questions.map(question => question.id));
      const dates = [...questions.map(question => question.created_at), ...notes.map(note => note.date)]
        .filter(Boolean)
        .sort((a, b) => timeOf(b) - timeOf(a));

      return {
        ...company,
        access,
        mt_ids: mtIds,
        mts: mtIds.map(id => state.users.find(user => user.id === id)).filter(Boolean) as KnowledgeUser[],
        mt: state.users.find(entry => entry.id === company.mt_id) ?? null,
        ogy: state.users.find(entry => entry.id === company.ogy_id) ?? null,
        question_count: questions.length,
        solved_count: questions.filter(q => q.status === 'cozuldu' || q.status === 'otomatik_cevaplandi').length,
        know_how_count: notes.length,
        // V25 kuralı: KB kaydı şirkete bağlanmaz, şirketin sorusundan doğar.
        kb_count: state.articles.filter(
          article => !article.company_id && article.source_question_id && questionIds.has(article.source_question_id)
        ).length,
        last_activity: dates[0] ?? null
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
}

/**
 * `POST /companies/merge` — mükerrer kaydı birleştirir (RACI: Admin).
 *
 * Kaynak şirkete bağlı ne varsa hedefe taşınır, sonra kaynak kayıt silinir.
 * Sıra önemli: kayıtlar taşınmadan şirket silinirse soru ve notlar sahipsiz
 * kalır ve hiçbir ekranda görünmez.
 */
export async function mergeCompanies({ source_id, target_id }: MergeCompaniesInput): Promise<MergeCompaniesResult> {
  await delay(260);
  const state = store();
  const user = await getCurrentUser();
  if (user.role !== 'admin') {
    throw new Error('Şirket birleştirme yalnızca Admin yetkisindedir (RACI: Şirket kaydı yönetimi/birleştirme).');
  }
  if (source_id === target_id) {
    throw new Error('Kaynak ve hedef şirket aynı olamaz.');
  }
  const source = state.companies.find(entry => entry.id === source_id);
  const target = state.companies.find(entry => entry.id === target_id);
  if (!source) {
    throw new Error(`Kaynak şirket bulunamadı: ${source_id}`);
  }
  if (!target) {
    throw new Error(`Hedef şirket bulunamadı: ${target_id}`);
  }

  let moved = 0;
  for (const question of state.questions) {
    if (question.company_id === source_id) {
      question.company_id = target_id;
      moved += 1;
    }
  }
  for (const note of state.notes) {
    if (note.company_id === source_id) {
      note.company_id = target_id;
      moved += 1;
    }
  }
  for (const article of state.articles) {
    if (article.company_id === source_id) {
      article.company_id = target_id;
      moved += 1;
    }
  }
  state.companies = state.companies.filter(entry => entry.id !== source_id);
  persist();

  return { deleted_name: source.name, moved_records: moved, target };
}

/* ═══ Bilgi Bankası kayıtları ════════════════════════════════════════════ */

/** KB kaydının dayandığı mevzuat içeriği + içeriğin kaynak sitesi (05 §3). */
function sourceLink(state: MockStore, contentId?: string | null): LegislationContentWithSource | null {
  const content = state.legislationContents.find(entry => entry.id === contentId);
  if (!content) {
    return null;
  }

  return { ...content, source: state.legislationSources.find(source => source.id === content.source_id) ?? null };
}

/**
 * V25: Bilgi Bankası kaynağa dayalı GENEL bilgi tutar. Şirkete özel kayıt
 * buradan hiç dönmez. V44: onay kademesi yok, her kayıt yayındadır.
 */
export async function getArticles({ tag_id, search }: { tag_id?: string; search?: string } = {}): Promise<
  ArticleListItem[]
> {
  await delay();
  const state = store();
  const query = trLower(search);

  return state.articles
    .filter(
      article =>
        !article.company_id &&
        article.privacy_class !== 'sirkete_ozel' &&
        (!tag_id || (article.tag_id ?? []).includes(tag_id)) &&
        (!query || trLower(`${article.title} ${article.content}`).includes(query))
    )
    .map(article => ({
      ...maskArticle(article),
      tags: (article.tag_id ?? []).map(id => state.tags.find(tag => tag.id === id)).filter(Boolean) as Tag[],
      company: state.companies.find(company => company.id === article.company_id) ?? null,
      source_legislation: sourceLink(state, article.source_legislation_id),
      flag_count: state.flags.filter(
        flag => flag.target_kind === 'kb_kaydi' && flag.target_id === article.id && flag.status !== 'kapandi'
      ).length
    }))
    .sort((a, b) => String(b.updated_at || b.date || '').localeCompare(String(a.updated_at || a.date || '')));
}

/* ═══ Bilgi Bankası dökümanları ══════════════════════════════════════════ */

/**
 * ⚠️ PROTOTİP SINIRI — DOSYA BAYTLARI
 *
 * Gerçek dosya deposu (S3/Blob) yok. Yüklenen dosyanın veri URL'i yalnızca bu
 * bellek deposunda durur: sekme kapanınca kaybolur ve `sessionStorage`'a
 * YAZILMAZ (kota dolar, tüm mock depoyu bozar). Sonuç:
 *   · Oturum içinde yüklenen belge gerçek dosya olarak önizlenir/indirilir.
 *   · Tohum belgelerde ve önceki oturumların belgelerinde `previewable: false` —
 *     kullanıcı bunu ekranda görür, indirme butonu sessizce bozuk durmaz.
 * Gerçek ortamda bu depo nesne deposuna taşınır; imzalar aynı kalır.
 */
const documentFileStore = new Map<string, string>();

/** 4 MB üstü dosyanın veri URL'i hiç tutulmaz — bellekte tutmanın anlamı yok. */
const MAX_INLINE_PREVIEW_BYTES = 4 * 1024 * 1024;

export async function getDocuments({ search, tag_id }: { search?: string; tag_id?: string } = {}): Promise<
  KnowledgeDocumentListItem[]
> {
  await delay();
  const state = store();
  const query = trLower(search);

  return state.documents
    .filter(
      document =>
        (!tag_id || (document.tag_id ?? []).includes(tag_id)) &&
        (!query || trLower(`${document.name} ${document.file_name} ${document.extracted_text ?? ''}`).includes(query))
    )
    .map(document => ({
      ...document,
      tags: (document.tag_id ?? []).map(id => state.tags.find(tag => tag.id === id)).filter(Boolean) as Tag[],
      uploader: state.users.find(user => user.id === document.uploaded_by) ?? null,
      previewable: documentFileStore.has(document.id)
    }))
    .sort((a, b) => timeOf(b.uploaded_at) - timeOf(a.uploaded_at));
}

/**
 * `POST /kb-documents` — belge yükler.
 *
 * Yetki Bilgi Uzmanı Havuzu'nda: Bilgi Bankası'na kalıcı bilgi girmek onların
 * işi (RACI). Admin bile yüklemiyor — KB kaydı güncellemede de aynı kural.
 */
export async function createDocument({
  name,
  file_name,
  mime_type,
  size_bytes,
  tag_id = [],
  extracted_text,
  data_url
}: CreateDocumentInput): Promise<KnowledgeDocument> {
  if (!file_name?.trim()) {
    throw new Error('Dosya adı boş olamaz.');
  }
  if (size_bytes > KB_DOCUMENT_RULES.maxBytes) {
    throw new Error(`Dosya boyutu ${Math.round(KB_DOCUMENT_RULES.maxBytes / 1024 / 1024)} MB sınırını aşıyor.`);
  }
  const extension = documentExtension(file_name);
  if (!(KB_DOCUMENT_RULES.extensions as readonly string[]).includes(extension)) {
    throw new Error(`Bu dosya türü kabul edilmiyor: .${extension}`);
  }

  await delay(320);
  const state = store();
  const user = await getCurrentUser();
  if (user.role !== 'bilgi_uzmani') {
    throw new Error("Bilgi Bankası'na belge yükleme yetkisi Bilgi Uzmanı Havuzu'na aittir (RACI).");
  }

  const text = extracted_text?.trim();
  const document: KnowledgeDocument = {
    id: newId('dok'),
    name: name?.trim() || file_name.trim(),
    file_name: file_name.trim(),
    mime_type,
    size_bytes,
    tag_id: Array.isArray(tag_id) ? tag_id : [],
    uploaded_by: user.id,
    uploaded_at: now(),
    ...(text ? { extracted_text: text } : {}),
    // 03 §3: metni olmayan belge indekslenmez ve cevaplarda kaynak olamaz.
    indexed: Boolean(text)
  };
  state.documents.push(document);

  if (data_url && size_bytes <= MAX_INLINE_PREVIEW_BYTES) {
    documentFileStore.set(document.id, data_url);
  }
  persist();

  return document;
}

/** `DELETE /kb-documents/:id` — belgeyi kaldırır (RACI: Bilgi Uzmanı). */
export async function deleteDocument(documentId: string): Promise<{ ok: true }> {
  await delay(180);
  const state = store();
  const user = await getCurrentUser();
  if (user.role !== 'bilgi_uzmani') {
    throw new Error("Belge kaldırma yetkisi Bilgi Uzmanı Havuzu'na aittir (RACI).");
  }
  if (!state.documents.some(entry => entry.id === documentId)) {
    throw new Error(`Belge bulunamadı: ${documentId}`);
  }

  state.documents = state.documents.filter(entry => entry.id !== documentId);
  documentFileStore.delete(documentId);
  persist();

  return { ok: true };
}

/** Oturum içi önizleme/indirme kaynağı; yoksa `null` (bkz. depo notu). */
export async function getDocumentFileUrl(documentId: string): Promise<string | null> {
  return documentFileStore.get(documentId) ?? null;
}

/* ═══ Sorular ════════════════════════════════════════════════════════════ */

export async function getQuestions({
  company_id,
  status,
  asker_id
}: { company_id?: string; status?: string; asker_id?: string } = {}): Promise<QuestionListItem[]> {
  await delay();
  const state = store();
  const user = await getCurrentUser();

  return state.questions
    .filter(
      question =>
        (!company_id || question.company_id === company_id) &&
        (!status || question.status === status) &&
        (!asker_id || question.asker_id === asker_id) &&
        isQuestionVisible(state, user, question) // Ç8 — şirkete özel içerik kapısı
    )
    .map(question => {
      const answers = state.answers.filter(answer => answer.question_id === question.id);

      return {
        ...maskQuestion(question),
        answer_count: answers.length,
        expert_answer_count: answers.filter(answer => answer.kind === 'uzman').length,
        real_answer_count: answers.filter(answer => !answer.not_found).length,
        attempt_count: answers.filter(answer => answer.not_found).length,
        flag_count: state.flags.filter(
          flag => flag.target_kind === 'soru' && flag.target_id === question.id && flag.status !== 'kapandi'
        ).length
      };
    })
    .sort((a, b) => timeOf(b.created_at) - timeOf(a.created_at));
}

export async function getQuestion(id: string): Promise<QuestionDetail | null> {
  await delay(80);
  const state = store();
  const user = await getCurrentUser();
  const question = state.questions.find(entry => entry.id === id);
  if (!question) {
    return null;
  }
  // Ç8: doğrudan bağlantıyla da erişilemez — kapı listede değil kayıtta.
  if (!isQuestionVisible(state, user, question)) {
    throw new Error('Bu soru, ilgili şirkete atanmış Müşteri Temsilcisi/OGY ve Bilgi Uzmanı ekibiyle sınırlıdır.');
  }

  const answers: AnswerWithFeedback[] = state.answers
    .filter(answer => answer.question_id === id)
    .map(answer => ({
      ...maskAnswer(answer, question.privacy_class),
      feedback: state.feedback.filter(entry => entry.target_kind === 'cevap' && entry.target_id === answer.id)
    }))
    .sort((a, b) => timeOf(a.created_at) - timeOf(b.created_at));

  return { ...maskQuestion(question), answers: answers };
}

/**
 * Otomatik cevap eşleştirme — 03 §3.
 *
 * MOCK motor: etiket + anahtar kelime skorlaması. Gerçek mimaride bu blok
 * embedding tabanlı anlamsal aramayla değişir; imza aynı kalır.
 */
function matchArticles(state: MockStore, question: Question): (Article & { _textScore: number; _score: number })[] {
  const haystack = trLower(question.text);
  const stopWords = new Set(seedStopWords.map(trLower));
  // Soru kalıbı ve alan-geneli sözcükler ayıklanır: bunlar hemen her kayıtta
  // geçtiği için eşleşme kanıtı sayılamaz.
  const words = haystack.split(/[^\p{L}\p{N}]+/u).filter(word => word.length > 3 && !stopWords.has(word));

  return (
    state.articles
      // 05 §5: PII/maskeleme gerekçeli açık flag varsa kaynak olarak kullanılmaz.
      .filter(
        article =>
          !state.flags.some(
            flag =>
              flag.target_kind === 'kb_kaydi' &&
              flag.target_id === article.id &&
              flag.status === 'acik' &&
              /pii|maskele|kişisel veri/i.test(flag.reason)
          )
      )
      .map(article => {
        // METİN SKORU: sorunun sözcükleriyle gerçek örtüşme — "konu gerçekten
        // aynı mı" sorusunun tek dürüst kanıtı.
        let textScore = 0;
        const pool = trLower(`${article.title} ${article.content}`);
        for (const word of words) {
          if (pool.includes(word)) {
            textScore += 1;
          }
        }
        // Etiket sözlüğü üzerinden dolaylı eşleşme (03 §4 tagging motoru).
        for (const tagId of article.tag_id ?? []) {
          for (const keyword of seedTagDictionary[tagId] ?? []) {
            if (haystack.includes(trLower(keyword))) {
              textScore += 2;
            }
          }
        }

        // BAĞLAM SKORU: yalnızca SIRALAMA için, nitelendirme için değil.
        const sharedTags = (article.tag_id ?? []).filter(tagId => question.tag_id.includes(tagId));
        let contextScore = sharedTags.length * 5;
        if (question.company_id && article.company_id === question.company_id) {
          contextScore += 3;
        }

        return { ...article, _textScore: textScore, _score: textScore + contextScore };
      })
      // KRİTİK KURAL (Vizyon İlke #1 — "asla uydurma cevap üretilmez"):
      // Etiket veya şirket eşleşmesi TEK BAŞINA cevap üretmeye yetmez. Nitelendirme
      // yalnızca metin örtüşmesine bakar; etiket/şirket sadece sıralamayı iyileştirir.
      .filter(article => article._textScore >= 2)
      .sort((a, b) => b._score - a._score)
      .map(article => ({ ...maskArticle(article), _textScore: article._textScore, _score: article._score }))
  );
}

export async function createQuestion({
  text,
  company_id = null,
  tag_id = [],
  privacy_class = 'genel',
  auto_answer = true
}: CreateQuestionInput): Promise<QuestionCreated> {
  if (!text?.trim()) {
    throw new Error('Soru metni boş olamaz.');
  }
  // Dasi bu süre boyunca THINKING state'inde kalır (14 §2). Gerçek bir RAG
  // sorgusu saniyeler sürdüğü için kısa tutulduğunda hem thinking animasyonu
  // görünmüyor hem de "anında cevap" hissi sistemin araştırdığı izlenimini
  // zayıflatıyordu. thinking videosu 2,1 sn — loop en az bir tur atsın.
  await delay(3400);
  const state = store();
  const user = await getCurrentUser();

  // Ç8: atanmadığın bir şirket adına soru açılamaz — açılsa soru anında kendi
  // görüş alanının dışına düşerdi.
  if (company_id && !hasCompanyAccess(state, user, company_id)) {
    throw new Error('Bu şirkete atanmış değilsin; soruyu bu şirketle ilişkilendiremezsin.');
  }

  const question: Question = {
    id: newId('q'),
    text: text.trim(),
    asker_id: user.id,
    company_id: company_id || null,
    tag_id: Array.isArray(tag_id) ? tag_id : [],
    // V43: soru yaşam döngüsünde 'acik' ara durumu yok. Kayıt ya Dasi'nin
    // cevabıyla 'otomatik_cevaplandi' olur ya da ortak havuzda bekler.
    status: 'eskale_edildi',
    escalated_at: now(),
    created_at: now(),
    privacy_class
  };
  state.questions.push(question);

  const matches = auto_answer ? matchArticles(state, question) : [];
  let answer: Answer | null = null;

  if (matches.length) {
    const best = matches[0];
    answer = {
      id: newId('c'),
      question_id: question.id,
      kind: 'otomatik',
      text: `${best.title}\n\n${best.content}`,
      answered_by: null,
      references: matches.slice(0, 3).map(article => article.id),
      attachments: [],
      verified: false,
      verified_by: null,
      created_at: now()
    };
    question.status = 'otomatik_cevaplandi';
    question.escalated_at = null;
    state.answers.push(answer);
  }
  // else: Dasi doğrulanmış bir kaynak bulamadığında sahte/boş bir cevap kaydı
  // üretmez. Soru, oluşturulurken atanan 'eskale_edildi' durumunda kalır.

  persist();

  return {
    ...maskQuestion(question),
    answers: answer ? [maskAnswer(answer, question.privacy_class)] : [],
    escalated_to_expert: !answer
  };
}

/* ═══ Eskalasyon havuzu ══════════════════════════════════════════════════ */

/**
 * `GET /pool` — uzman yanıtı bekleyen questions. PRD §4.3: havuz KİŞİYE ATANMAZ,
 * uzmanlardan biri devralır; bu yüzden satırda "atanan" alanı yoktur.
 *
 * Prototipten sapma: burada Ç8 kapısı da uygulanıyor (`isQuestionVisible`).
 * Uygulamada görünen sonuç değişmez — havuzu yalnızca Bilgi Uzmanı ve Admin
 * görür, ikisi de kapıdan muaf — ama kapının api katmanında tek noktada
 * durması kuralı (plan §1.4) böylece havuzda da bozulmuyor.
 */
export async function getEscalationPool(): Promise<EscalationPoolItem[]> {
  await delay();
  const state = store();
  const user = await getCurrentUser();

  return (
    state.questions
      .filter(question => question.status === 'eskale_edildi' && isQuestionVisible(state, user, question))
      .map(question => {
        const start = timeOf(question.escalated_at || question.created_at);

        return {
          ...maskQuestion(question),
          asker: state.users.find(entry => entry.id === question.asker_id) ?? null,
          company: state.companies.find(entry => entry.id === question.company_id) ?? null,
          waiting_hours: start ? Math.max(0, Math.round((Date.now() - start) / 36e5)) : null,
          previous_answers: state.answers
            .filter(answer => answer.question_id === question.id)
            .map(answer => maskAnswer(answer, question.privacy_class))
        };
      })
      // 07 §3: en uzun bekleyen üstte — havuzun kuyruk mantığı bu.
      .sort((a, b) => (b.waiting_hours ?? 0) - (a.waiting_hours ?? 0))
  );
}

/**
 * `POST /questions/:id/expert-answer` — Bilgi Uzmanı cevabı.
 *
 * PRD §4.3 / FR-5: uzman cevabı doğrulama beklemez, `verified: true` doğar ve
 * soruyu havuzdan çıkarır. Yetki havuzun kendisine aittir: Admin bu ekranı
 * salt görüntüler (RACI), o yüzden rol kapısı burada da duruyor — UI'daki
 * kilidin yanında ikinci savunma hattı.
 */
export async function answerQuestion(
  questionId: string,
  { text, attachments = [] }: AnswerQuestionInput
): Promise<AnswerQuestionResult> {
  if (!text?.trim()) {
    throw new Error('Cevap metni boş olamaz.');
  }
  await delay(220);
  const state = store();
  const question = state.questions.find(entry => entry.id === questionId);
  if (!question) {
    throw new Error(`Soru bulunamadı: ${questionId}`);
  }
  const user = await getCurrentUser();
  if (user.role !== 'bilgi_uzmani') {
    throw new Error('Bu işlem için Bilgi Uzmanı yetkisi gerekir (PRD §3).');
  }

  const answer: Answer = {
    id: newId('c'),
    question_id: questionId,
    kind: 'uzman',
    text: text.trim(),
    answered_by: user.id,
    references: [],
    attachments: Array.isArray(attachments) ? attachments : [],
    verified: true,
    verified_by: user.id,
    created_at: now()
  };
  state.answers.push(answer);
  question.status = 'cozuldu';
  question.solved_at = now();
  persist();

  return { question: maskQuestion(question), answer: maskAnswer(answer, question.privacy_class) };
}

/* ═══ Bilgi Bankası kaydı üretme ═════════════════════════════════════════ */

/**
 * `POST /kb-articles` — uzman cevabını kalıcı bilgiye çevirir.
 *
 * V44 onay kademesini kaldırdı; onayla birlikte kaybolmaması gereken iki kural
 * yazma anına taşındı:
 *   1. Bilgi Bankası GENEL bilgi tutar — şirkete özel içerik giremez (V25).
 *   2. Kayıt yalnızca UZMAN cevabından üretilir; Dasi'nin otomatik cevabı ve
 *      derin araştırma çıktısı doğrudan kalıcı bilgiye dönüşmez (Vizyon İlke #1).
 */
export async function createArticle({
  question_id = null,
  answer_id = null,
  title,
  content,
  tag_id = [],
  source_legislation_id = null,
  privacy_class = 'genel'
}: CreateArticleInput): Promise<Article> {
  if (!title?.trim()) {
    throw new Error('Bilgi Bankası kaydının başlığı boş olamaz.');
  }
  if (!content?.trim()) {
    throw new Error('Bilgi Bankası kaydının içeriği boş olamaz.');
  }
  if (privacy_class === 'sirkete_ozel') {
    throw new Error(
      "Şirkete özel içerik Bilgi Bankası'na alınamaz. Kayıt önce şirket bilgisinden arındırılmalı; şirkete özel hâli sorunun kendisinde kalır."
    );
  }
  await delay(200);
  const state = store();

  if (question_id) {
    const sourceAnswer = answer_id
      ? state.answers.find(entry => entry.id === answer_id)
      : state.answers.filter(entry => entry.question_id === question_id && entry.kind === 'uzman').pop();
    if (!sourceAnswer || sourceAnswer.kind !== 'uzman') {
      throw new Error(
        'Bilgi Bankası kaydı yalnızca uzman cevabından oluşturulabilir; AI cevapları doğrudan kalıcı bilgiye dönüşmez.'
      );
    }
  }
  if (source_legislation_id && !state.legislationContents.some(entry => entry.id === source_legislation_id)) {
    throw new Error(`Mevzuat içeriği bulunamadı: ${source_legislation_id}`);
  }

  const article: Article = {
    id: newId('kb'),
    // FR-KVKK-4: kalıcı kayda maskelenmiş hâl yazılır.
    title: maskText(title.trim(), privacy_class),
    content: maskText(content.trim(), privacy_class),
    source_question_id: question_id,
    source_answer_id: answer_id,
    source_legislation_id,
    source_kind: 'uzman_girdisi',
    // V25: KB kaydı şirkete bağlanmaz — şirket izi, kaydın doğduğu SORUDA durur.
    company_id: null,
    tag_id: Array.isArray(tag_id) ? tag_id : [],
    verified: true,
    privacy_class,
    date: now().slice(0, 10),
    updated_at: now()
  };
  state.articles.push(article);

  const question = question_id ? state.questions.find(entry => entry.id === question_id) : null;
  if (question) {
    question.kb_article_id = article.id;
  }
  // Taramadan gelen mevzuat içeriği, kalıcı bilgiye dönüştüğü anda taslak
  // olmaktan çıkar (eskiden bu geçiş onay anında yapılıyordu).
  const legislation = source_legislation_id
    ? state.legislationContents.find(entry => entry.id === source_legislation_id)
    : null;
  if (legislation) {
    legislation.status = 'onaylandi';
  }
  persist();

  return article;
}

/* ═══ Değerlendirme ve doğrulama ═════════════════════════════════════════ */

export async function rateAnswer(answerId: string, { sufficient }: { sufficient: boolean }): Promise<RateAnswerResult> {
  await delay(160);
  const state = store();
  const answer = state.answers.find(entry => entry.id === answerId);
  if (!answer) {
    throw new Error(`Cevap bulunamadı: ${answerId}`);
  }
  const question = state.questions.find(entry => entry.id === answer.question_id);
  if (!question) {
    throw new Error(`Soru bulunamadı: ${answer.question_id}`);
  }

  answer.rating = sufficient ? 'yeterli' : 'yetersiz';
  if (sufficient) {
    question.status = 'cozuldu';
    question.solved_at = now();
  } else {
    // PRD §4.3 — ortak havuza düşer, kişiye ATANMAZ.
    question.status = 'eskale_edildi';
    question.escalated_at = now();
  }
  persist();

  return { question: maskQuestion(question), answer: maskAnswer(answer, question.privacy_class) };
}

/** FR-7 — Bilgi Uzmanı, AI/Derin Araştırma cevabını verified'a yükseltir. */
export async function verifyAnswer(answerId: string): Promise<Answer> {
  await delay(150);
  const state = store();
  const answer = state.answers.find(entry => entry.id === answerId);
  if (!answer) {
    throw new Error(`Cevap bulunamadı: ${answerId}`);
  }
  const user = await getCurrentUser();
  if (user.role !== 'bilgi_uzmani') {
    throw new Error("Doğrulama yetkisi yalnızca Bilgi Uzmanı Havuzu'na aittir (RACI: Verified statüsü verme).");
  }

  answer.verified = true;
  answer.verified_by = user.id;
  answer.verified_at = now();
  persist();

  return answer;
}

/* ═══ Kullanıcılar ═══════════════════════════════════════════════════════ */

export async function getUsers({ role, active }: { role?: string; active?: boolean } = {}): Promise<UserListItem[]> {
  await delay(80);
  const state = store();

  return state.users
    .filter(user => (!role || user.role === role) && (active === undefined || user.active === active))
    .map(user => ({
      ...user,
      question_count: state.questions.filter(question => question.asker_id === user.id).length,
      answer_count: state.answers.filter(answer => answer.answered_by === user.id).length,
      mt_of_companies: state.companies
        .filter(company => companyMtIds(company).includes(user.id))
        .map(company => company.name)
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
}

/* ═══ Operasyon notları (know-how) ═══════════════════════════════════════ */

/**
 * `GET /know-how` — tüm şirketleri kapsayan çapraz not listesi.
 *
 * Ç2: FR-10 know-how'ı şirket sayfasının İÇİNDE tutar; bu liste onun yerine
 * geçmez, üstüne çapraz bir görünüm ekler.
 * Ç8: know-how tanımı gereği şirkete özeldir — liste, kullanıcının MT/OGY
 * olarak atandığı şirketlerle sınırlıdır (Bilgi Uzmanı ve Admin muaf).
 */
export async function getNotes({ company_id, status }: { company_id?: string; status?: string } = {}): Promise<
  NoteListItem[]
> {
  await delay();
  const state = store();
  const user = await getCurrentUser();

  return state.notes
    .filter(
      note =>
        (!company_id || note.company_id === company_id) &&
        (!status || note.status === status) &&
        hasCompanyAccess(state, user, note.company_id)
    )
    .map(note => ({
      ...note,
      company: state.companies.find(company => company.id === note.company_id) ?? null,
      author: state.users.find(entry => entry.id === note.author_id) ?? null
    }))
    .sort((a, b) => timeOf(b.date) - timeOf(a.date));
}

/** `POST /companies/:id/know-how` — Ç8: göremediğin şirkete not yazamazsın. */
export async function createNote(companyId: string, { text }: CreateNoteInput): Promise<Note> {
  if (!text?.trim()) {
    throw new Error('Operasyon notu boş olamaz.');
  }
  await delay(180);
  const state = store();
  if (!state.companies.some(company => company.id === companyId)) {
    throw new Error(`Şirket bulunamadı: ${companyId}`);
  }
  const user = await getCurrentUser();
  if (!hasCompanyAccess(state, user, companyId)) {
    throw new Error('Bu şirkete atanmış Müşteri Temsilcisi/OGY değilsin; operasyon notu ekleyemezsin.');
  }

  const note: Note = {
    id: newId('kh'),
    company_id: companyId,
    text: text.trim(),
    author_id: user.id,
    status: 'yayinda',
    date: now()
  };
  state.notes.push(note);
  persist();

  return note;
}

/* ═══ Geribildirim ═══════════════════════════════════════════════════════ */

export async function createFeedback({ target_kind, target_id, value }: CreateFeedbackInput): Promise<Feedback> {
  if (!['cevap', 'kb_kaydi'].includes(target_kind)) {
    throw new Error(`Geçersiz target_kind: ${target_kind}`);
  }
  if (!['onay', 'red'].includes(value)) {
    throw new Error(`Geçersiz değer: ${value}`);
  }
  await delay(130);
  const state = store();
  const user = await getCurrentUser();

  // Aynı kullanıcının aynı hedefe önceki işaretini günceller — ikinci bir kayıt açmaz.
  const existing = state.feedback.find(
    entry => entry.target_kind === target_kind && entry.target_id === target_id && entry.user_id === user.id
  );
  if (existing) {
    existing.value = value;
    existing.date = now();
    persist();

    return existing;
  }

  const feedback: Feedback = {
    id: newId('g'),
    target_kind,
    target_id,
    user_id: user.id,
    value,
    date: now()
  };
  state.feedback.push(feedback);
  persist();

  return feedback;
}

export async function getFeedbackSummary({
  target_kind,
  target_id
}: {
  target_kind: string;
  target_id: string;
}): Promise<FeedbackSummary> {
  await delay(30);
  const state = store();
  const user = await getCurrentUser();
  const list = state.feedback.filter(entry => entry.target_kind === target_kind && entry.target_id === target_id);

  return {
    approvals: list.filter(entry => entry.value === 'onay').length,
    rejections: list.filter(entry => entry.value === 'red').length,
    mine: list.find(entry => entry.user_id === user.id)?.value ?? null
  };
}

/* ═══ Raporlama (flag) ═══════════════════════════════════════════════════ */

export async function createFlag({ target_kind, target_id, reason }: CreateFlagInput): Promise<Flag> {
  if (!['soru', 'cevap', 'kb_kaydi'].includes(target_kind)) {
    throw new Error(`Geçersiz target_kind: ${target_kind}`);
  }
  if (!reason?.trim()) {
    throw new Error('Rapor gerekçesi zorunludur.');
  }
  await delay(180);
  const state = store();
  const user = await getCurrentUser();

  const flag: Flag = {
    id: newId('f'),
    target_kind,
    target_id,
    reporter_id: user.id,
    reason: reason.trim(),
    status: 'acik', // PRD §4.8: Açık → İnceleniyor → Güncellendi/Kapandı
    updated_by: null,
    date: now(),
    // 05 §5: PII gerekçeli raporlar öncelikli sıraya girer.
    priority: /pii|maskele|kişisel veri|tckn|kimlik no/i.test(reason)
  };
  state.flags.push(flag);
  persist();

  return flag;
}

/** Raporun hedefinin okunur başlığı — hedef tipine göre farklı kayıttan gelir. */
function flagTargetTitle(state: MockStore, flag: Flag): string {
  if (flag.target_kind === 'kb_kaydi') {
    const article = state.articles.find(entry => entry.id === flag.target_id);

    return article ? maskArticle(article).title : '(bulunamadı)';
  }

  if (flag.target_kind === 'cevap') {
    const answer = state.answers.find(entry => entry.id === flag.target_id);
    const question = answer ? state.questions.find(entry => entry.id === answer.question_id) : null;

    return question ? maskQuestion(question).text : answer ? 'Cevap' : '(bulunamadı)';
  }

  const question = state.questions.find(entry => entry.id === flag.target_id);

  return question ? maskQuestion(question).text : '(bulunamadı)';
}

/** `GET /flag` — içerik raporları; rapor kişiye değil Bilgi Uzmanı havuzuna aittir. */
/**
 * Raporlanan kaydın kendisi. Maskeleme burada da geçerli: rapor ekranı
 * kişisel veri içeren bir kaydı ham hâliyle göstermez (04-KVKK §4).
 */
function flagTarget(state: MockStore, flag: Flag): FlagTarget | null {
  if (flag.target_kind === 'kb_kaydi') {
    const article = state.articles.find(entry => entry.id === flag.target_id);
    if (!article) {
      return null;
    }
    const masked = maskArticle(article);

    return { id: masked.id, kind: 'kb_kaydi', title: masked.title, body: masked.content };
  }

  if (flag.target_kind === 'cevap') {
    const answer = state.answers.find(entry => entry.id === flag.target_id);
    if (!answer) {
      return null;
    }
    const question = state.questions.find(entry => entry.id === answer.question_id);
    const masked = maskAnswer(answer, question?.privacy_class);

    return {
      id: masked.id,
      kind: 'cevap',
      title: question ? maskQuestion(question).text : 'Cevap',
      body: masked.text,
      question: question ? { id: question.id, text: maskQuestion(question).text } : null
    };
  }

  const question = state.questions.find(entry => entry.id === flag.target_id);
  if (!question) {
    return null;
  }
  const masked = maskQuestion(question);

  return { id: masked.id, kind: 'soru', title: masked.text };
}

export async function getFlags({ status }: { status?: string } = {}): Promise<FlagListItem[]> {
  await delay();
  const state = store();
  const findUser = (id?: string | null) => state.users.find(entry => entry.id === id) ?? null;

  return (
    state.flags
      .filter(flag => !status || flag.status === status)
      .map(flag => ({
        ...flag,
        target_title: flagTargetTitle(state, flag),
        target: flagTarget(state, flag),
        reporter: findUser(flag.reporter_id),
        updater: findUser(flag.updated_by),
        replier: findUser(flag.replied_by)
      }))
      // 05 §5: PII/maskeleme gerekçeli raporlar üstte, sonra en yeni.
      .sort((a, b) => Number(Boolean(b.priority)) - Number(Boolean(a.priority)) || timeOf(b.date) - timeOf(a.date))
  );
}

/* ═══ Bülten ═════════════════════════════════════════════════════════════ */

/**
 * `GET /bulletin` — haftalık mevzuat bülteni (PRD §4.7: her Pazartesi 09:00).
 * Her satır atıf verdiği mevzuat içeriklerini ve içeriğin kaynak sitesini taşır;
 * ekran "SGK · …" biçiminde kaynağı gösterebilsin.
 */
/**
 * `POST /flags/:id/update` — PRD §4.8 (V40 ile sadeleşti).
 *
 * Açık → İnceleniyor → Kapandı. Kapanışta sonuç zorunlu: rapor "neden"
 * kapandığını kaybetmemeli, aksi hâlde aynı içerik tekrar raporlandığında
 * uzman geçmiş kararı göremez.
 */
export async function updateFlag(
  flagId: string,
  { status, outcome, description = '', source_url = '', source_title = '' }: UpdateFlagInput
): Promise<Flag> {
  if (!['acik', 'inceleniyor', 'kapandi'].includes(status)) {
    throw new Error(`Geçersiz rapor durumu: ${status}`);
  }
  if (status === 'kapandi' && !['guncellendi', 'degisiklik_gerekmedi'].includes(outcome ?? '')) {
    throw new Error('Kapatılan rapor için sonuç belirtilmeli: guncellendi | degisiklik_gerekmedi.');
  }
  await delay(160);
  const state = store();
  const flag = state.flags.find(entry => entry.id === flagId);
  if (!flag) {
    throw new Error(`Rapor bulunamadı: ${flagId}`);
  }
  const user = await getCurrentUser();
  if (user.role !== 'bilgi_uzmani') {
    throw new Error('Rapor inceleme/güncelleme yalnızca Bilgi Uzmanı Havuzu yetkisindedir (RACI).');
  }

  flag.status = status;
  flag.outcome = status === 'kapandi' ? outcome : undefined;
  flag.updated_by = user.id;
  flag.description = description;

  // Uzman yanıtı = "değişiklik gerekmedi" kararının bildiren kişiye gerekçeli
  // dönüşü. Karar bildirime dönüşmezse MT aynı şeyi tekrar raporlar (07 §2).
  if (status === 'kapandi' && outcome === 'degisiklik_gerekmedi' && description.trim()) {
    flag.expert_reply = description.trim();
    flag.replied_by = user.id;
    flag.reply_source = source_url.trim()
      ? { title: source_title.trim() || 'Dayanak kaynağı', url: source_url.trim() }
      : undefined;
    flag.reporter_ack = 'bekliyor';
  }
  flag.updated_at = now();
  persist();

  return flag;
}

/**
 * `PATCH /kb-articles/:id` — 05 §6 sürümleme.
 *
 * Önceki sürüm `version_history`'ye yazılır: raporla gelen bir düzeltmenin
 * neyi değiştirdiği sonradan izlenebilmeli.
 */
export async function updateArticle(articleId: string, { title, content }: UpdateArticleInput): Promise<Article> {
  if (!title?.trim() || !content?.trim()) {
    throw new Error('Başlık ve içerik boş bırakılamaz.');
  }
  await delay(180);
  const state = store();
  const article = state.articles.find(entry => entry.id === articleId);
  if (!article) {
    throw new Error(`Bilgi Bankası kaydı bulunamadı: ${articleId}`);
  }
  const user = await getCurrentUser();
  if (user.role !== 'bilgi_uzmani') {
    throw new Error('Bilgi Bankası güncellemesi yalnızca Bilgi Uzmanı Havuzu tarafından yapılabilir (RACI).');
  }

  article.version_history = [
    ...(article.version_history ?? []),
    { content: article.content, date: now(), title: article.title, updated_by: user.id }
  ];
  article.title = maskText(title.trim(), article.privacy_class);
  article.content = maskText(content.trim(), article.privacy_class);
  article.updated_at = now();
  persist();

  return article;
}

export async function getBulletins({ date }: { date?: string } = {}): Promise<BulletinListItem[]> {
  await delay(110);
  const state = store();

  return (
    state.bulletins
      .filter(entry => !date || entry.date === date)
      .map(entry => ({
        ...entry,
        contents: (entry.related_legislation_content_id ?? [])
          .map(id => sourceLink(state, id))
          .filter(Boolean) as LegislationContentWithSource[]
      }))
      // 07 §3: en yeni sayı üstte.
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
  );
}
