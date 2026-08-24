/**
 * Backend endpoint yolları.
 *
 * Yollar ve JSON alan adları İngilizce — sözleşme İngilizce sabitlendi
 * (eski Türkçe sürüm: `Tanıtım/13-api-sozlesmesi.md` §2).
 * Tarayıcı bu yollara doğrudan gitmez; `/api/knowledge/[...path]` proxy'si
 * SSO access token'ını sunucu tarafında ekleyip üst servise iletir.
 *
 * Üst servis rota başına seçilir: mesaj gönderme (`POST /questions`) `AI_API_URL`'e,
 * geri kalan her şey `BACKEND_API_URL`'e gider. Tablo:
 * `src/app/api/knowledge/[...path]/service-routing.ts`.
 */
export const KNOWLEDGE_API_BASE = '/api/knowledge';

/**
 * NOT: aşağıdaki yollardan yalnızca `tags` backend tarafından teslim edildi.
 * Kalanı sözleşme taslağı — hangisinin canlı olduğunu `api/index.ts` içindeki
 * `NEXT_PUBLIC_KNOWLEDGE_LIVE_ENDPOINTS` listesi belirler.
 */
export const endpoints = {
  me: '/me',
  questions: '/questions',
  question: (id: string) => `/questions/${id}`,
  expertAnswer: (id: string) => `/questions/${id}/expert-answer`,
  rateAnswer: (id: string) => `/answers/${id}/rate`,
  verifyAnswer: (id: string) => `/answers/${id}/verify`,
  pool: '/pool',
  feedback: '/feedback',
  articles: '/kb-articles',
  article: (id: string) => `/kb-articles/${id}`,
  /**
   * TESLİM EDİLDİ (2026-08-24): `labels` gibi `/knowledge` önekli.
   * Tam URL: `${BACKEND_API_URL}/knowledge/documents`.
   * Yanıt `DocumentResponseDto` — bizim `KnowledgeDocument`'tan dar;
   * eşleme ve backend'in tutamadığı alanlar `adapters/http.ts`'te.
   */
  documents: '/knowledge/documents',
  document: (id: string) => `/knowledge/documents/${id}`,
  flags: '/flags',
  updateFlag: (id: string) => `/flags/${id}/update`,
  companies: '/companies',
  company: (id: string) => `/companies/${id}`,
  companyNotes: (id: string) => `/companies/${id}/know-how`,
  mergeCompanies: '/companies/merge',
  notes: '/know-how',
  /**
   * TESLİM EDİLDİ (2026-08-24): backend etiketleri "label" olarak adlandırıyor
   * ve `knowledge-service` altındaki yolları `/knowledge` ile önekliyor.
   * Beş uç noktanın tamamı canlı (kaynak: servisin kendi OpenAPI'si,
   * `http://test.knowledge-service.dtst.k8s/api-docs`, `label-controller`):
   *
   *   GET    /knowledge/labels        → LabelResponseDto[]
   *   POST   /knowledge/labels        → LabelCreateRequestDto  → LabelResponseDto
   *   GET    /knowledge/labels/{id}   → LabelResponseDto
   *   PUT    /knowledge/labels/{id}   → LabelUpdateRequestDto  → LabelResponseDto
   *   DELETE /knowledge/labels/{id}   → 200, gövde yok
   *
   * Yanıt şekli bizim `Tag` tipimizden farklı — eşleme `adapters/http.ts`'te.
   */
  tags: '/knowledge/labels',
  tag: (id: string) => `/knowledge/labels/${id}`,
  suggestTags: '/tags/suggest',
  users: '/users',
  user: (id: string) => `/users/${id}`,
  bulletin: '/bulletin',
  metrics: '/metrics',
  legislationSources: '/legislation-sources'
} as const;
