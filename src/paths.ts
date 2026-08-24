export const paths = {
  index: '/',
  knowledge: '/knowledge',
  // Bilgi Bankası ekranları — prototip eşlemesi: docs/knowledge-migration-plan.md §2
  knowledgeDasi: '/knowledge/dasi',
  knowledgeQuestions: '/knowledge/questions',
  knowledgeNewQuestion: '/knowledge/questions/new',
  knowledgeEscalations: '/knowledge/escalations',
  knowledgeReported: '/knowledge/reported',
  knowledgeArticles: '/knowledge/articles',
  knowledgeCompanies: '/knowledge/companies',
  knowledgeCompany: (id: string) => `/knowledge/companies/${id}`,
  knowledgeNotes: '/knowledge/notes',
  knowledgeBulletin: '/knowledge/bulletin',
  knowledgeBulletinEntry: (id: string) => `/knowledge/bulletin/${id}`,
  knowledgeTags: '/knowledge/tags',
  knowledgeUsers: '/knowledge/users',
  knowledgeRoles: '/knowledge/roles',
  knowledgeSettings: '/knowledge/settings',
  knowledgeMetrics: '/knowledge/metrics',
  notAuthorized: '/errors/not-authorized',
  notFound: '/errors/not-found'
} as const;
