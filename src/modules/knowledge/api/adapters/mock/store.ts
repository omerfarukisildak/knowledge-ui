import {
  seedAnswers,
  seedArticles,
  seedBulletins,
  seedCompanies,
  seedDocuments,
  seedFeedback,
  seedFlags,
  seedLegislationContents,
  seedLegislationSources,
  seedNotes,
  seedQuestions,
  seedTags,
  seedUsers
} from 'src/modules/knowledge/mocks/seed-data';
import type {
  Answer,
  Article,
  BulletinEntry,
  Company,
  Feedback,
  Flag,
  KnowledgeDocument,
  KnowledgeUser,
  LegislationContent,
  LegislationSource,
  Note,
  Question,
  Tag
} from 'src/modules/knowledge/types';

/**
 * Mock adaptörünün yazılabilir deposu.
 *
 * Prototipte `sessionStorage` bu işi görüyordu ve `api-client.js` dışında hiçbir
 * yer ona dokunmuyordu (V2). Aynı kural burada da geçerli: depoya yalnızca bu
 * klasördeki adaptör erişir, hiçbir bileşen `sessionStorage` görmez.
 *
 * Sekme kapanınca sıfırlanır; `seed-data.ts` tohum kaynağı olarak kalır.
 */

// v2: alan adları İngilizceye geçti; v1 snapshot'ları Türkçe anahtarlı olduğundan
// okunamaz — anahtarı yükseltmek eski oturumları sessizce tohum veriye düşürür.
// v3: tohuma yeni kullanıcı (id 37) ve döküman koleksiyonu eklendi. Koleksiyon
// tamamlama guard'ı yalnızca EKSİK koleksiyonu doldurur, var olan dizinin içine
// yeni kayıt eklemez — anahtar yükseltilmezse yeni kullanıcı hiç görünmezdi.
const STORE_KEY = 'knowledge-mock-store-v3';
const SESSION_USER_KEY = 'knowledge-mock-session-user-v1';

export interface MockStore {
  users: KnowledgeUser[];
  companies: Company[];
  tags: Tag[];
  legislationSources: LegislationSource[];
  legislationContents: LegislationContent[];
  articles: Article[];
  questions: Question[];
  answers: Answer[];
  feedback: Feedback[];
  flags: Flag[];
  notes: Note[];
  bulletins: BulletinEntry[];
  documents: KnowledgeDocument[];
}

const COLLECTIONS: (keyof MockStore)[] = [
  'users',
  'companies',
  'tags',
  'legislationSources',
  'legislationContents',
  'articles',
  'questions',
  'answers',
  'feedback',
  'flags',
  'notes',
  'bulletins',
  'documents'
];

function clone<T>(value: T): T {
  return typeof structuredClone === 'function' ? structuredClone(value) : (JSON.parse(JSON.stringify(value)) as T);
}

/** Derin kopya — tohum dizileri asla mutasyona uğramaz. */
function freshSeed(): MockStore {
  return {
    users: clone(seedUsers),
    companies: clone(seedCompanies),
    tags: clone(seedTags),
    legislationSources: clone(seedLegislationSources),
    legislationContents: clone(seedLegislationContents),
    articles: clone(seedArticles),
    questions: clone(seedQuestions),
    answers: clone(seedAnswers),
    feedback: clone(seedFeedback),
    flags: clone(seedFlags),
    notes: clone(seedNotes),
    bulletins: clone(seedBulletins),
    documents: clone(seedDocuments)
  };
}

let cache: MockStore | null = null;

/** Sunucu tarafında `sessionStorage` yok; depo istek ömrü boyunca bellekte durur. */
const storage = (): Storage | null => (typeof window === 'undefined' ? null : window.sessionStorage);

export function store(): MockStore {
  if (cache) {
    return cache;
  }

  try {
    const saved = storage()?.getItem(STORE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<MockStore>;
      const base = freshSeed();
      cache = { ...base, ...parsed };
      // Şema genişlediğinde eksik koleksiyonu tohumdan tamamla.
      for (const key of COLLECTIONS) {
        if (!Array.isArray(cache[key])) {
          (cache[key] as unknown) = base[key];
        }
      }
      return cache;
    }
  } catch (error) {
    console.error('[knowledge/mock] Oturum verisi okunamadı, tohum veriye dönülüyor.', error);
  }

  cache = freshSeed();
  persist();

  return cache;
}

export function persist(): void {
  try {
    storage()?.setItem(STORE_KEY, JSON.stringify(cache));
  } catch (error) {
    // Kota dolabilir — akış bellek üzerinden sürer.
    console.error('[knowledge/mock] Oturum verisi yazılamadı; veri yalnızca bu sayfada geçerli.', error);
  }
}

export function resetStore(): void {
  cache = freshSeed();
  persist();
}

/** Geliştirici rol değiştiricisi (K4) — gerçek rol kaynağı geldiğinde kalkar. */
export function readSessionUserId(): string | null {
  try {
    return storage()?.getItem(SESSION_USER_KEY) ?? null;
  } catch {
    return null;
  }
}

export function writeSessionUserId(id: string): void {
  try {
    storage()?.setItem(SESSION_USER_KEY, id);
  } catch (error) {
    console.error('[knowledge/mock] Oturum kullanıcısı yazılamadı.', error);
  }
}
