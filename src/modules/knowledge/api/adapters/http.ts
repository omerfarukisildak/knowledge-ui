import { KB_DOCUMENT_FOLDER, documentExtension } from 'src/modules/knowledge/constants';
import type {
  Answer,
  AnswerQuestionInput,
  AnswerQuestionResult,
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
  KnowledgeDocument,
  KnowledgeDocumentListItem,
  KnowledgeUser,
  MergeCompaniesInput,
  MergeCompaniesResult,
  Note,
  NoteListItem,
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

import { KNOWLEDGE_API_BASE, endpoints } from '../endpoints';

/**
 * HTTP adaptörü — mock adaptörüyle imza imzasına aynı.
 *
 * Tarayıcı backend'e doğrudan gitmez: `/api/knowledge/[...path]` proxy'si SSO
 * access token'ını sunucu tarafında ekler, token hiç istemciye düşmez.
 */

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
}

async function request<T>(path: string, { method = 'GET', body, query }: RequestOptions = {}): Promise<T> {
  const url = new URL(`${KNOWLEDGE_API_BASE}${path}`, window.location.origin);

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url.toString(), {
    method,
    cache: 'no-store',
    ...(body === undefined
      ? {}
      : {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
  });

  if (!response.ok) {
    // Backend hata gövdesini `message` alanında döndürüyor (bkz. api/_lib/proxy.ts).
    const detail = await response.json().catch(() => null);
    throw new Error(detail?.message ?? `İstek başarısız (${response.status}).`);
  }

  /**
   * Servis silme uç noktalarında 204 değil, GÖVDESİZ 200 döndürüyor
   * (OpenAPI: `DELETE /knowledge/labels/{id}` → 200, content yok). Bu yüzden
   * gövde önce metin olarak okunur; boşsa `undefined` döner, aksi hâlde parse
   * edilir. `response.json()`'ı doğrudan çağırmak boş gövdede hata veriyordu.
   */
  const text = await response.text();

  return (text ? JSON.parse(text) : undefined) as T;
}

export async function getCurrentUser(): Promise<KnowledgeUser> {
  return request<KnowledgeUser>(endpoints.me);
}

/** Rol değiştirici yalnızca mock adaptöründe var; gerçek rol SSO'dan gelir. */
export async function setCurrentUser(): Promise<never> {
  throw new Error('Rol değiştirme yalnızca mock veri kaynağında kullanılabilir.');
}

export async function resetMockData(): Promise<never> {
  throw new Error('Veri sıfırlama yalnızca mock veri kaynağında kullanılabilir.');
}

/* ═══ Etiketler — backend "label" diyor ══════════════════════════════════ */

/**
 * `LabelResponseDto` — beş etiket uç noktasının tamamının döndürdüğü gövde
 * (2026-08-24, kaynak: servisin OpenAPI'si `label-controller`).
 *
 * Alan adları camelCase ve kayıt bizim `Tag` tipimizden dar: kategori, durum ve
 * kullanım sayacı yok, `id` sayı. Bu yüzden yanıt doğrudan cast EDİLMEZ, altta
 * eşlenir — ekranlar hangi kaynağın çalıştığını bilmemeye devam ediyor.
 */
interface BackendLabel {
  id: number;
  label: string;
  createdAt?: string | null;
  createdBy?: number | null;
  updatedAt?: string | null;
  updatedBy?: number | null;
}

function toTag(entry: BackendLabel): Tag {
  return {
    id: String(entry.id),
    name: entry.label,
    /**
     * Backend'de karşılığı olmayan iki alan. Kategori boş kalıyor (uydurmak,
     * olmayan bir taksonomi varmış gibi gösterirdi); dönen her etiket yayında
     * sayıldığı için durum `aktif`. İkisi de sözleşmeye eklenince buradan kalkar.
     */
    category: '',
    status: 'aktif'
  };
}

export async function getTags({ status, category }: { status?: string; category?: string } = {}): Promise<Tag[]> {
  const labels = await request<BackendLabel[]>(endpoints.tags);

  // Backend sorgu parametresi desteklemiyor; filtre burada uygulanıyor ki
  // mock adaptörüyle davranış aynı kalsın.
  return labels
    .map(toTag)
    .filter(tag => (!status || tag.status === status) && (!category || tag.category === category))
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
}

/** `GET /knowledge/labels/{id}` — tek etiket. */
export async function getTag(tagId: string): Promise<Tag> {
  return toTag(await request<BackendLabel>(endpoints.tag(tagId)));
}

/**
 * `POST /knowledge/labels` — gövde `LabelCreateRequestDto`: `{ label, createdBy }`.
 *
 * `createdBy` BURADAN gönderilmez: servis onu token'dan türetmiyor, bu yüzden
 * proxy rotası (`api/knowledge/[...path]/route.ts`) oturumdaki çalışan
 * kimliğini sunucu tarafında gövdeye ekliyor. Kimlik tarayıcıya hiç inmez ve
 * istemci başkasının adına kayıt açamaz.
 *
 * `category` ve `status` sözleşmede YOK: dizinin taşıdığı kategori seçimi
 * backend'e yazılamaz. Sessizce düşürmek yerine ekranda söylüyoruz
 * (Etiketler ekranındaki canlı kaynak uyarısı).
 */
export async function createTag(input: CreateTagInput): Promise<Tag> {
  const label = input.name?.trim();
  if (!label) {
    throw new Error('Etiket adı boş olamaz.');
  }

  /**
   * Ad normalize EDİLMEZ (mock adaptörü `kidem-tazminati` biçimine çevirir).
   * Canlı taksonomi insan-okur biçimde: "Kısa Çalışma", "Hayat Sigortası".
   * Kebab-case yazmak yeni kayıtları mevcut listenin yanında bozuk gösterirdi.
   */
  return toTag(await request<BackendLabel>(endpoints.tags, { body: { label }, method: 'POST' }));
}

/**
 * `PUT /knowledge/labels/{id}` — gövde `LabelUpdateRequestDto`: `{ label, updatedBy }`.
 * PATCH değil PUT; tek güncellenebilir alan `label`. `updatedBy`'yi `createTag`
 * ile aynı sebeple proxy rotası ekliyor.
 *
 * `status`/`category` için backend'de alan yok. Yalnızca onları değiştiren bir
 * çağrı sessizce "başarılı" dönerse kullanıcı kaydettiğini sanır — bu yüzden
 * hata veriyoruz. Etiketler ekranı canlı kaynakta bu aksiyonu zaten kapatıyor;
 * bu, o kapının atlanması hâlinde ikinci savunma hattı.
 */
export async function updateTag(tagId: string, input: UpdateTagInput): Promise<Tag> {
  const label = input.name?.trim();
  if (!label) {
    throw new Error('Backend etiketlerde yalnızca adı güncelliyor; durum ve kategori alanı sözleşmede yok.');
  }

  return toTag(await request<BackendLabel>(endpoints.tag(tagId), { body: { label }, method: 'PUT' }));
}

/**
 * `DELETE /knowledge/labels/{id}` — GERÇEK silme, gövdesiz 200 döner.
 *
 * 09 §3 "kullanımdaki etiket silinmez, pasife alınır" kuralının backend'de
 * karşılığı yok: `status` alanı olmadığı için pasife alma imkânsız, elimizdeki
 * tek yazma aksiyonu kalıcı silme. Uyarı ekranda, silme onayında veriliyor.
 */
export async function deleteTag(tagId: string): Promise<{ ok: true }> {
  await request<void>(endpoints.tag(tagId), { method: 'DELETE' });

  return { ok: true };
}

export async function suggestTags({ text }: { text: string }): Promise<Tag[]> {
  return request<Tag[]>(endpoints.suggestTags, { method: 'POST', body: { text } });
}

export async function getCompanies({ status }: { status?: string } = {}): Promise<CompanyListItem[]> {
  return request<CompanyListItem[]>(endpoints.companies, { query: { status } });
}

export async function mergeCompanies(input: MergeCompaniesInput): Promise<MergeCompaniesResult> {
  return request<MergeCompaniesResult>(endpoints.mergeCompanies, { method: 'POST', body: input });
}

export async function getArticles({ tag_id, search }: { tag_id?: string; search?: string } = {}): Promise<
  ArticleListItem[]
> {
  return request<ArticleListItem[]>(endpoints.articles, { query: { tag_id, search } });
}

/* ═══ Bilgi Bankası dökümanları ═════════════════════════════════════════ */

/**
 * `GET|POST|PUT|DELETE /knowledge/documents` gövdesi (2026-08-24 doğrulandı,
 * kaynak: servisin kendi OpenAPI'si `${BACKEND_API_URL}/../api-docs`).
 *
 * Kayıt bizim `KnowledgeDocument` tipimizden DAR. Backend'in tutmadığı alanlar:
 *
 *   file_name / mime_type / size_bytes  → `fileName` yalnızca create'te KABUL
 *                                          edilir, response'ta DÖNMEZ.
 *   extracted_text / indexed            → alan yok; Dasi'nin okuduğu metin
 *                                          şimdilik saklanamıyor.
 *   tag_id                              → belge-etiket ilişkisi yok.
 *   previewable / indirme               → serviste dosya indirme uç noktası yok.
 *
 * Bu yüzden yanıt cast EDİLMEZ, altta eşlenir ve tutulamayan alanlar dürüstçe
 * boş döner — uydurulmaz. Alanlar backend'e eklendiğinde yalnızca `toDocument`
 * güncellenir; ekranlar ve mock adaptörü değişmez.
 */
interface BackendDocument {
  id: number;
  category?: string | null;
  keywords?: string | null;
  handleId?: string | null;
  active?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  updatedBy?: number | null;
  createdBy?: number | null;
  createdByName?: string | null;
  till?: string | null;
}

/** Uzantıdan MIME türü — backend `mimeType` tutmadığı için ikonu bu besler. */
const MIME_BY_EXTENSION: Record<string, string> = {
  csv: 'text/csv',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  md: 'text/markdown',
  pdf: 'application/pdf',
  txt: 'text/plain',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

function toDocument(entry: BackendDocument): KnowledgeDocumentListItem {
  // `category` görünen adı taşır: create sırasında `name` oraya yazılır, çünkü
  // response'ta ad taşıyabilecek başka alan yok.
  const name = entry.category?.trim() || entry.handleId || `#${entry.id}`;

  return {
    file_name: name,
    id: String(entry.id),
    // Backend metin çıkarımı tutmuyor; hiçbir belge indekslenmiş sayılmaz.
    indexed: false,
    mime_type: MIME_BY_EXTENSION[documentExtension(name)] ?? 'application/octet-stream',
    name,
    // Dosya indirme uç noktası yok — önizleme/indirme kapalı.
    previewable: false,
    size_bytes: 0,
    tag_id: [],
    tags: [],
    uploaded_at: entry.createdAt ?? '',
    uploaded_by: entry.createdBy === null || entry.createdBy === undefined ? null : String(entry.createdBy),
    // Backend yalnızca `createdByName` döndürüyor. Liste yalnızca `name` okuyor;
    // e-posta/takım/rol yer tutucudur ve hiçbir yerde gösterilmez.
    uploader: entry.createdByName
      ? {
          active: true,
          email: '',
          id: String(entry.createdBy ?? ''),
          name: entry.createdByName,
          role: 'operasyon',
          team: ''
        }
      : null
  };
}

/**
 * Arama ve etiket süzgeci backend'de yok; liste tam çekilip burada süzülür.
 * Kayıt sayısı büyüdüğünde bu backend'e taşınmalı.
 */
export async function getDocuments({ search, tag_id }: { search?: string; tag_id?: string } = {}): Promise<
  KnowledgeDocumentListItem[]
> {
  const rows = (await request<BackendDocument[] | null>(endpoints.documents)) ?? [];
  const documents = rows.map(toDocument);

  if (tag_id) {
    // Belge-etiket ilişkisi backend'de yok: etikete göre süzme daima boş döner.
    return [];
  }

  const needle = search?.trim().toLowerCase();

  return needle ? documents.filter(document => document.name.toLowerCase().includes(needle)) : documents;
}

/** `FileReader` data URL'ini backend'in beklediği saf base64 gövdesine indirger. */
function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error('Dosya okunamadı.'));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * `POST /knowledge/documents` — gövde JSON, dosya base64 `fileContent` alanında
 * (multipart DEĞİL; sözleşme OpenAPI'den doğrulandı).
 *
 * Servis dosyayı ayrı bir `file-storage-service`'e yazıp `handleId` üretiyor.
 * O bacak 2026-08-24 itibarıyla 502 veriyor (gönderilen içerikten bağımsız);
 * hata mesajı kullanıcıya olduğu gibi çıkar, sessizce yutulmaz.
 */
export async function createDocument(input: CreateDocumentInput & { file?: File }): Promise<KnowledgeDocument> {
  const created = await request<BackendDocument>(endpoints.documents, {
    body: {
      active: true,
      category: input.name,
      fileContent: input.file ? await toBase64(input.file) : null,
      fileFolder: KB_DOCUMENT_FOLDER,
      fileName: input.file_name,
      keywords: input.tag_id?.length ? input.tag_id.join(',') : null
    },
    method: 'POST'
  });

  return toDocument(created);
}

export async function deleteDocument(documentId: string): Promise<{ ok: true }> {
  await request<void>(endpoints.document(documentId), { method: 'DELETE' });

  return { ok: true };
}

/** Serviste dosya indirme uç noktası yok; gelene kadar önizleme kapalı. */
export async function getDocumentFileUrl(): Promise<string | null> {
  return null;
}

export async function getQuestions({
  company_id,
  status,
  asker_id
}: { company_id?: string; status?: string; asker_id?: string } = {}): Promise<QuestionListItem[]> {
  return request<QuestionListItem[]>(endpoints.questions, { query: { company_id, status, asker_id } });
}

export async function getQuestion(id: string): Promise<QuestionDetail | null> {
  return request<QuestionDetail | null>(endpoints.question(id));
}

export async function createQuestion(input: CreateQuestionInput): Promise<QuestionCreated> {
  return request<QuestionCreated>(endpoints.questions, { method: 'POST', body: input });
}

export async function rateAnswer(answerId: string, { sufficient }: { sufficient: boolean }): Promise<RateAnswerResult> {
  return request<RateAnswerResult>(endpoints.rateAnswer(answerId), { method: 'POST', body: { sufficient } });
}

export async function verifyAnswer(answerId: string): Promise<Answer> {
  return request<Answer>(endpoints.verifyAnswer(answerId), { method: 'POST', body: {} });
}

export async function getUsers({ role, active }: { role?: string; active?: boolean } = {}): Promise<UserListItem[]> {
  return request<UserListItem[]>(endpoints.users, { query: { role, active } });
}

export async function createFeedback(input: CreateFeedbackInput): Promise<Feedback> {
  return request<Feedback>(endpoints.feedback, { method: 'POST', body: input });
}

export async function getFeedbackSummary({
  target_kind,
  target_id
}: {
  target_kind: string;
  target_id: string;
}): Promise<FeedbackSummary> {
  return request<FeedbackSummary>(endpoints.feedback, { query: { target_kind, target_id } });
}

export async function getNotes({ company_id, status }: { company_id?: string; status?: string } = {}): Promise<
  NoteListItem[]
> {
  return request<NoteListItem[]>(endpoints.notes, { query: { company_id, status } });
}

export async function createNote(companyId: string, input: CreateNoteInput): Promise<Note> {
  return request<Note>(endpoints.companyNotes(companyId), { method: 'POST', body: input });
}

export async function createFlag(input: CreateFlagInput): Promise<Flag> {
  return request<Flag>(endpoints.flags, { method: 'POST', body: input });
}

export async function getEscalationPool(): Promise<EscalationPoolItem[]> {
  return request<EscalationPoolItem[]>(endpoints.pool);
}

export async function answerQuestion(questionId: string, input: AnswerQuestionInput): Promise<AnswerQuestionResult> {
  return request<AnswerQuestionResult>(endpoints.expertAnswer(questionId), { method: 'POST', body: input });
}

export async function createArticle(input: CreateArticleInput): Promise<Article> {
  return request<Article>(endpoints.articles, { method: 'POST', body: input });
}

export async function getFlags({ status }: { status?: string } = {}): Promise<FlagListItem[]> {
  return request<FlagListItem[]>(endpoints.flags, { query: { status } });
}

export async function updateFlag(flagId: string, input: UpdateFlagInput): Promise<Flag> {
  return request<Flag>(endpoints.updateFlag(flagId), { method: 'POST', body: input });
}

export async function updateArticle(articleId: string, input: UpdateArticleInput): Promise<Article> {
  return request<Article>(endpoints.article(articleId), { method: 'PATCH', body: input });
}

export async function getBulletins({ date }: { date?: string } = {}): Promise<BulletinListItem[]> {
  return request<BulletinListItem[]>(endpoints.bulletin, { query: { date } });
}
