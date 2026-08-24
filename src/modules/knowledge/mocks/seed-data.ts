/* eslint-disable */
// Prototip tohum verisi — `Knowledge-Base-PRD/app/js/mock-data.js`'ten taşındı.
//
// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  BU DOSYAYI YALNIZCA `api/adapters/mock.ts` OKUR.                        ║
// ║  Hiçbir bileşen, sayfa ya da hook buradan import ETMEZ (ESLint kuralı).  ║
// ╚══════════════════════════════════════════════════════════════════════════╝
//
// Alan adları Türkçe: bunlar backend'in wire formatı (bkz. Tanıtım/13-api-sozlesmesi.md),
// tercih değil sözleşme. Şirket dokümanları koleksiyonu taşınmadı — kapsam dışı
// (bkz. docs/knowledge-migration-plan.md §8).
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

// ---------- KULLANICILAR ----------
export const seedUsers: KnowledgeUser[] = [
  {
    id: 'u1',
    name: 'Ayşe Demir',
    email: 'ayse.demir@datassist.com.tr',
    role: 'operasyon',
    team: 'operasyon',
    active: true
  },
  {
    id: 'u2',
    name: 'Ecmel Kaya',
    email: 'ecmel.kaya@datassist.com.tr',
    role: 'operasyon',
    team: 'operasyon',
    active: true
  },
  { id: 'u3', name: 'Göksel Bey', email: 'goksel@datassist.com.tr', role: 'bilgi_uzmani', team: 'operasyon', active: true },
  {
    id: 'u4',
    name: 'Tuğçe Kulaksız',
    email: 'tugce.kulaksiz@datassist.com.tr',
    role: 'bilgi_uzmani',
    team: 'operasyon',
    active: true
  },
  { id: 'u5', name: 'Ömer', email: 'omer@datassist.com.tr', role: 'admin', team: 'urun', active: true },
  // GENİŞLETME (V9): Kullanıcılar ekranının (FR-22) dolu görünmesi için
  { id: 'u6', name: 'Selin Aydın', email: 'selin.aydin@datassist.com.tr', role: 'operasyon', team: 'urun', active: true },
  { id: 'u7', name: 'Burak Şen', email: 'burak.sen@datassist.com.tr', role: 'operasyon', team: 'yazilim', active: false },
  // GENİŞLETME (V41): Sorular ekranı üç sayfalık veriyle çalışırken soran
  // çeşitliliği gerekiyordu. Avatar sprite'ının boş kalan 8. gözü bu kullanıcıya.
  {
    id: 'u8',
    name: 'Merve Aksoy',
    email: 'merve.aksoy@datassist.com.tr',
    role: 'operasyon',
    team: 'operasyon',
    active: true
  },
  /**
   * Geliştiricinin gerçek kimliği. Id, backend'in döndürdüğü sayısal kullanıcı
   * kimliğiyle aynı (`/knowledge/labels` yanıtındaki `createdBy: 37`) — `/me`
   * canlıya geçtiğinde aynı kayda denk gelsin diye 'u9' değil '37'.
   *
   * Rolü Bilgi Uzmanı: geliştirme sırasında havuz, rapor inceleme ve belge
   * yükleme akışları varsayılan olarak çalışsın. Admin'i u5'te BIRAKIYORUZ,
   * yoksa şirket birleştirme gibi admin-only akışlar test edilemez.
   */
  {
    id: '37',
    name: 'Ömer Işıldak',
    email: 'omer.isildak@datassist.com',
    role: 'bilgi_uzmani',
    team: 'urun',
    active: true
  }
];

// ---------- ŞİRKETLER ----------
export const seedCompanies: Company[] = [
  { id: 's1', name: 'Ergene Tekstil', mt_id: 'u1', mt_ids: ['u1', 'u2', 'u8'], ogy_id: 'u5', status: 'onayli' },
  { id: 's2', name: 'Işıldak Lojistik', mt_id: 'u2', mt_ids: ['u2', 'u6', 'u1'], ogy_id: 'u5', status: 'onayli' },
  { id: 's3', name: 'Kaya Otomotiv', mt_id: 'u1', mt_ids: ['u1', 'u6', 'u8'], ogy_id: 'u5', status: 'onayli' },
  // GENİŞLETME (V9): Admin'in "birleştir" aksiyonunu (birlestirSirket) demo
  // edebilmesi için bilinçli olarak mükerrer görünümlü bir kayıt + onay bekleyen bir kayıt
  { id: 's4', name: 'Işıldak Lojistik A.Ş.', mt_id: 'u2', mt_ids: ['u2', 'u6'], ogy_id: 'u5', status: 'onay_bekliyor' },
  { id: 's5', name: 'Demir İnşaat', mt_id: 'u6', mt_ids: ['u6', 'u1', 'u2'], ogy_id: 'u5', status: 'onayli' }
];

// ---------- ETİKETLER ----------
export const seedTags: Tag[] = [
  { id: 't1', name: 'sgk-bildirimi', category: 'mevzuat', status: 'aktif' },
  { id: 't2', name: 'resmi-tatil-ucreti', category: 'mevzuat', status: 'aktif' },
  { id: 't3', name: 'fazla-mesai', category: 'mevzuat', status: 'aktif' },
  { id: 't4', name: 'ise-iade', category: 'mevzuat', status: 'aktif' },
  { id: 't5', name: 'kvkk', category: 'mevzuat', status: 'aktif' },
  { id: 't6', name: 'bes', category: 'mevzuat', status: 'aktif' },
  { id: 't7', name: 'sgk-tavan', category: 'mevzuat', status: 'aktif' },
  { id: 't8', name: 'yillik-izin', category: 'mevzuat', status: 'aktif' },
  { id: 't9', name: 'puantaj', category: 'surec', status: 'aktif' },
  // GENİŞLETME (V9): hackathon-sprint-plani.md "10-15 tag" hedefi
  { id: 't10', name: 'kidem-tazminati', category: 'mevzuat', status: 'aktif' },
  { id: 't11', name: 'ihbar-oneli', category: 'mevzuat', status: 'aktif' },
  { id: 't12', name: 'asgari-ucret', category: 'mevzuat', status: 'aktif' },
  { id: 't13', name: 'dogum-izni', category: 'mevzuat', status: 'aktif' },
  { id: 't14', name: 'bordro-kontrol', category: 'surec', status: 'aktif' },
  { id: 't15', name: 'destek-talebi', category: 'destek', status: 'pasif' },
  // GENİŞLETME (V26): iskanunu.com "Sizin Sorduklarınız" içeriklerinden gelen
  // 18 yeni KB kaydının konu başlıkları
  { id: 't16', name: 'fesih', category: 'mevzuat', status: 'aktif' },
  { id: 't17', name: 'is-sagligi-guvenligi', category: 'mevzuat', status: 'aktif' },
  { id: 't18', name: 'yapay-zeka', category: 'mevzuat', status: 'aktif' },
  { id: 't19', name: 'esitlik-ilkesi', category: 'mevzuat', status: 'aktif' },
  { id: 't20', name: 'arabuluculuk', category: 'mevzuat', status: 'aktif' },
  { id: 't21', name: 'kismi-zamanli-calisma', category: 'mevzuat', status: 'aktif' },
  { id: 't22', name: 'gelir-vergisi', category: 'mevzuat', status: 'aktif' },
  { id: 't23', name: 'istirahat-raporu', category: 'mevzuat', status: 'aktif' },
  { id: 't24', name: 'genc-isci', category: 'mevzuat', status: 'aktif' },
  { id: 't25', name: 'bayram-yardimi', category: 'mevzuat', status: 'aktif' },
  { id: 't26', name: 'isten-cikis-kodu', category: 'surec', status: 'aktif' },
  { id: 't27', name: 'hafta-tatili', category: 'mevzuat', status: 'aktif' }
];

// ---------- MEVZUAT KAYNAKLARI ----------
// GENİŞLETME (V14): 03-veri-modeli-ve-mimari.md §5'teki A-K kataloğundan
// temsili bir alt küme. Derin Araştırma'nın (mock) "taradığı" sabit liste.
// oncelik: 1=resmi mevzuat, 2=kurum duyurusu, 3=içtihat, 4=özel kaynak (§5, K kuralı 1)
export const seedLegislationSources: LegislationSource[] = [
  {
    id: 'mkay1',
    name: 'Resmî Gazete',
    url: 'https://www.resmigazete.gov.tr',
    section: 'A',
    kind: 'resmi',
    priority: 1,
    update_frequency: 'gunluk',
    active: true
  },
  {
    id: 'mkay2',
    name: 'Mevzuat Bilgi Sistemi',
    url: 'https://www.mevzuat.gov.tr',
    section: 'A',
    kind: 'resmi',
    priority: 1,
    update_frequency: 'gunluk',
    active: true
  },
  {
    id: 'mkay3',
    name: 'Sosyal Güvenlik Kurumu (SGK)',
    url: 'https://www.sgk.gov.tr',
    section: 'D',
    kind: 'kurum_duyurusu',
    priority: 2,
    update_frequency: 'gunluk',
    active: true
  },
  {
    id: 'mkay4',
    name: 'Gelir İdaresi Başkanlığı (GİB)',
    url: 'https://www.gib.gov.tr',
    section: 'E',
    kind: 'kurum_duyurusu',
    priority: 2,
    update_frequency: 'gunluk',
    active: true
  },
  {
    id: 'mkay5',
    name: 'Çalışma ve Sosyal Güvenlik Bakanlığı',
    url: 'https://www.csgb.gov.tr',
    section: 'A',
    kind: 'kurum_duyurusu',
    priority: 2,
    update_frequency: 'haftalik',
    active: true
  },
  {
    id: 'mkay6',
    name: 'Yargıtay Karar Arama',
    url: 'https://karararama.yargitay.gov.tr',
    section: 'H',
    kind: 'ictihat',
    priority: 3,
    update_frequency: 'haftalik',
    active: true
  },
  {
    id: 'mkay7',
    name: 'KVKK',
    url: 'https://www.kvkk.gov.tr',
    section: 'I',
    kind: 'kurum_duyurusu',
    priority: 2,
    update_frequency: 'haftalik',
    active: true
  },
  {
    id: 'mkay8',
    name: 'iskanunu.com',
    url: 'https://www.iskanunu.com',
    section: 'J',
    kind: 'ozel_kaynak',
    priority: 4,
    update_frequency: 'gunluk',
    active: true
  }
];

// ---------- MEVZUAT İÇERİKLERİ ----------
// GENİŞLETME (V5): seedArticles.kaynak_mevzuat_id ve seedBulletins.ilgili_mevzuat_icerik_id
// alanları mk1..mk8'e işaret ediyordu ama bu dizi dosyada yoktu — kırık referanslar.
// Şema: 03-veri-modeli-ve-mimari.md §2 (gorsel_url alanı dahil).
export const seedLegislationContents: LegislationContent[] = [
  {
    id: 'mk1',
    source_id: 'mkay3',
    title: 'İşyeri kapanışında SGK bildirim yükümlülükleri',
    content:
      'İşyeri dosyasının kapatılması sürecinde işten ayrılış bildirgeleri ve son aya ait aylık prim/hizmet belgesinin zamanında verilmesi esastır.',
    url: 'https://www.iskanunu.com/sizin-sorduklariniz/isyeri-kapanisinda-sgk-bildirimi',
    image_url: '/assets/bulletin/sgk-tavan.jpg',
    accessed_at: '2025-11-11',
    revised_at: '2025-11-11',
    version: '1',
    status: 'onaylandi'
  },
  {
    id: 'mk2',
    source_id: 'mkay2',
    title: 'İş Kanunu m.47 — ulusal bayram ve genel tatil ücreti',
    content:
      'Çalışılmayan genel tatil gününde günlük ücret tam ödenir; çalışılması hâlinde bir günlük ücret daha ödenir.',
    url: 'https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=4857',
    image_url: '/assets/bulletin/yillik-izin.jpg',
    accessed_at: '2025-10-27',
    revised_at: '2025-10-27',
    version: '1',
    status: 'onaylandi'
  },
  {
    id: 'mk3',
    source_id: 'mkay8',
    title: 'Fazla mesainin ücret niteliği ve bordro riski',
    content:
      'Fazla mesainin bordroda ayrı kalem olarak gösterilmemesi, işçilik alacağı davalarında işveren aleyhine risk oluşturur.',
    url: 'https://www.iskanunu.com/fazla-mesai-ucret-niteligi',
    image_url: '/assets/bulletin/fazla-mesai.jpg',
    accessed_at: '2026-07-27',
    revised_at: '2026-07-27',
    version: '1',
    status: 'onaylandi'
  },
  {
    id: 'mk4',
    source_id: 'mkay6',
    title: 'Arabuluculuk tutanağı ve işe iade davası',
    content:
      'Arabuluculukta tutanağa bağlanan anlaşma taraflar için bağlayıcıdır; işe iade konulu anlaşmadan sonra yeniden dava açılması kural olarak mümkün değildir.',
    url: 'https://karararama.yargitay.gov.tr',
    image_url: '/assets/bulletin/ise-iade.jpg',
    accessed_at: '2026-07-27',
    revised_at: '2026-07-27',
    version: '1',
    status: 'onaylandi'
  },
  {
    id: 'mk5',
    source_id: 'mkay7',
    title: 'İşyerinde güvenlik kamerası — KVKK uyarıları',
    content:
      'Kamera görüntüleri kişisel veridir; kayıt alanı orantılı belirlenmeli, çalışanlar aydınlatma metniyle bilgilendirilmelidir.',
    url: 'https://www.kvkk.gov.tr',
    image_url: '/assets/bulletin/guvenlik-kamerasi.jpg',
    accessed_at: '2026-07-27',
    revised_at: '2026-07-27',
    version: '1',
    status: 'onaylandi'
  },
  {
    id: 'mk6',
    source_id: 'mkay3',
    title: 'Otomatik BES ve 18 yaş altı sigortalılar',
    content: 'Otomatik BES belirli yaş aralığındaki çalışanlara uygulanır; 18 yaş altı sigortalılar kapsam dışındadır.',
    url: 'https://www.sgk.gov.tr',
    image_url: '/assets/bulletin/bes-otomatik.jpg',
    accessed_at: '2025-10-08',
    revised_at: '2025-10-08',
    version: '1',
    status: 'onaylandi'
  },
  {
    id: 'mk7',
    source_id: 'mkay3',
    title: 'SGK prime esas kazanç tavanı uygulaması',
    content: 'Tavanı aşan kısım için SGK primi kesilmez, gelir vergisi matrahına dahil edilmeye devam eder.',
    url: 'https://www.sgk.gov.tr',
    image_url: '/assets/bulletin/sgk-tavan.jpg',
    accessed_at: '2025-09-23',
    revised_at: '2025-09-23',
    version: '1',
    status: 'onaylandi'
  },
  {
    id: 'mk8',
    source_id: 'mkay2',
    title: 'Yıllık ücretli izin — asgari süreler ve kayıt',
    content: 'İzin, kıdeme göre belirlenen asgari sürelerin altında kullandırılamaz; izin kaydı tutulması zorunludur.',
    url: 'https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=4857',
    image_url: '/assets/bulletin/yillik-izin.jpg',
    accessed_at: '2025-07-07',
    revised_at: '2025-07-07',
    version: '1',
    status: 'onaylandi'
  },
  {
    id: 'mk9',
    source_id: 'mkay1',
    title: '2026 yılı asgari ücret tespit kararı',
    content:
      "Asgari Ücret Tespit Komisyonu kararı Resmî Gazete'de yayımlandı; brüt ve net tutarlar ile işveren maliyeti güncellendi.",
    url: 'https://www.resmigazete.gov.tr',
    image_url: '/assets/bulletin/asgari-ucret.jpg',
    accessed_at: '2026-08-20',
    revised_at: '2026-08-20',
    version: '1',
    status: 'taslak'
  },
  {
    id: 'mk10',
    source_id: 'mkay7',
    title: 'Çalışan verilerinin işlenmesinde aydınlatma yükümlülüğü',
    content:
      'İşveren, çalışan kişisel verilerinin işlenme amacını ve saklama süresini aydınlatma metninde açıkça belirtmelidir.',
    url: 'https://www.kvkk.gov.tr',
    image_url: '/assets/bulletin/kvkk-genel.jpg',
    accessed_at: '2026-08-21',
    revised_at: '2026-08-21',
    version: '1',
    status: 'taslak'
  },
  // GENİŞLETME (V25): Bilgi Bankası kayıtları kaynağa dayanır. Kaynağı olmayan
  // üç KB kaydının dayanağı olarak eklendi.
  {
    id: 'mk11',
    source_id: 'mkay3',
    title: 'Analık hâli ve eksik gün gerekçe kodları',
    content:
      'Analık hâli nedeniyle çalışılmayan günler, aylık prim/hizmet belgesinde ilgili istirahat/analık eksik gün koduyla bildirilir; kodun rapor tarihleriyle örtüşmesi esastır.',
    url: 'https://www.sgk.gov.tr',
    image_url: '/assets/bulletin/sgk-tavan.jpg',
    accessed_at: '2026-08-19',
    revised_at: '2026-08-19',
    version: '1',
    status: 'taslak'
  },
  {
    id: 'mk12',
    source_id: 'mkay2',
    title: '1475 sayılı Kanun m.14 — kıdem tazminatı ve giydirilmiş ücret',
    content:
      'Kıdem tazminatı, çıplak ücrete süreklilik arz eden yan hakların eklenmesiyle bulunan giydirilmiş brüt ücret üzerinden hesaplanır; tutar dönemin kıdem tazminatı tavanıyla sınırlıdır.',
    url: 'https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=1475',
    image_url: '/assets/bulletin/asgari-ucret.jpg',
    accessed_at: '2026-06-14',
    revised_at: '2026-06-14',
    version: '1',
    status: 'onaylandi'
  },
  {
    id: 'mk13',
    source_id: 'mkay2',
    title: 'İş Kanunu m.17 — ihbar öneli süreleri',
    content:
      'Bildirim süreleri kıdeme göre iki, dört, altı ve sekiz hafta olarak belirlenmiştir; bu süreler asgari olup sözleşmeyle artırılabilir, azaltılamaz.',
    url: 'https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=4857',
    image_url: '/assets/bulletin/yillik-izin.jpg',
    accessed_at: '2026-05-19',
    revised_at: '2026-05-19',
    version: '1',
    status: 'onaylandi'
  },
  // GENİŞLETME (V26): iskanunu.com "Sizin Sorduklarınız" köşesinden alınan içerikler.
  // Özetler kendi cümlelerimizle yazılmıştır, birebir kopya değildir (bkz. dosya başlığı).
  {
    id: 'mk14',
    source_id: 'mkay8',
    title: '1 Mayıs Cuma gününe denk geldiğinde takip eden Cumartesi',
    content:
      '2429 sayılı Kanun, Cuma akşamı sona eren genel tatili takip eden Cumartesi gününün tatil yapılacağını düzenler; hükmün amacı, Cumartesi öğlene kadar çalışılan dönemde kesintisiz dinlenme sağlamaktı.',
    url: 'https://iskanunu.com/sizin-sorduklariniz/1-mayis-2026-cuma-gunune-denk-geliyor-2-mayis-cumartesi-genel-tatil-sayilir-mi/',
    image_url: '/assets/bulletin/yillik-izin.jpg',
    accessed_at: '2026-08-23',
    revised_at: '2026-04-29',
    version: '1',
    status: 'onaylandi'
  },
  {
    id: 'mk15',
    source_id: 'mkay8',
    title: 'İşyerinde üretken yapay zekâ kullanımı ve KVKK rehberleri',
    content:
      'KVKK, üretken yapay zekâ sistemlerinin kullanım alanları ve kişisel veri işleme boyutuna ilişkin rehberler yayımladı; işyerinde bu araçların kullanımı verimlilik sağlarken gizlilik ve kişisel veri riskleri doğurur.',
    url: 'https://iskanunu.com/sizin-sorduklariniz/calisanin-chatgpt-kullanmasi-isten-cikarma-nedeni-olur-mu/',
    image_url: '/assets/bulletin/kvkk-genel.jpg',
    accessed_at: '2026-08-23',
    revised_at: '2026-04-09',
    version: '1',
    status: 'onaylandi'
  },
  {
    id: 'mk16',
    source_id: 'mkay8',
    title: 'İş Kanunu m.5 — işverenin eşit davranma borcu',
    content:
      'İş ilişkisinde dil, ırk, cinsiyet, siyasi düşünce, felsefi inanç ve din gibi sebeplere dayanarak ayrım yapılamaz; benzer nitelikte iş yapan çalışanlar arasında geçerli bir sebep olmadan farklı uygulama, eşit davranma borcunun ihlali sayılabilir.',
    url: 'https://iskanunu.com/sizin-sorduklariniz/butce-doneminde-esitlik-ilkesine-dikkat/',
    image_url: '/assets/bulletin/asgari-ucret.jpg',
    accessed_at: '2026-08-23',
    revised_at: '2025-11-04',
    version: '1',
    status: 'onaylandi'
  },
  {
    id: 'mk17',
    source_id: 'mkay8',
    title: 'AYM kararı — işe iade arabuluculuğunda birlikte katılım şartının iptali',
    content:
      "7036 sayılı Kanun m.3/15'te yer alan, işe iade arabuluculuğunda asıl ve alt işverenin birlikte katılması ve iradelerinin uyuşması şartı Anayasa Mahkemesi kararıyla iptal edildi; karar 17 Ekim 2025 tarihli Resmî Gazete'de yayımlandı.",
    url: 'https://iskanunu.com/sizin-sorduklariniz/ise-iade-talebinde-asil-isveren-ve-alt-isveren-sorumlulugu/',
    image_url: '/assets/bulletin/ise-iade.jpg',
    accessed_at: '2026-08-23',
    revised_at: '2025-11-04',
    version: '1',
    status: 'onaylandi'
  },
  {
    id: 'mk18',
    source_id: 'mkay8',
    title: 'Kısmi süreliden tam süreliye geçişte SGK bildirim güncellemesi',
    content:
      'Geçişte işten çıkış ve yeniden giriş işlemi yapılmaz; SGK işe giriş bildirgesi güncelleme ekranından kısmi süreli çalışma işareti kaldırılarak bildirge güncellenir.',
    url: 'https://iskanunu.com/sizin-sorduklariniz/kismi-zamanli-calismadan-tam-zamanli-calismaya-geciste-yasal-bildirimler/',
    image_url: '/assets/bulletin/sgk-tavan.jpg',
    accessed_at: '2026-08-23',
    revised_at: '2025-10-27',
    version: '1',
    status: 'onaylandi'
  },
  {
    id: 'mk19',
    source_id: 'mkay8',
    title: 'İş Kanunu m.53 — yıllık ücretli izin süreleri ve diğer izin türleri',
    content:
      'Yıllık ücretli izin, bir yıllık kıdemi tamamlayan işçiye kıdemine göre 14, 20 ve 26 gün olarak verilir; bu süreler asgari olup sözleşmeyle artırılabilir.',
    url: 'https://iskanunu.com/sizin-sorduklariniz/ucretli-ve-ucretsiz-izin-turleri-nelerdir/',
    image_url: '/assets/bulletin/yillik-izin.jpg',
    accessed_at: '2026-08-23',
    revised_at: '2025-10-14',
    version: '1',
    status: 'onaylandi'
  },
  {
    id: 'mk20',
    source_id: 'mkay8',
    title: 'İş Kanunu m.25/I-b — sağlık sebebiyle haklı nedenle fesih',
    content:
      'İşçinin hastalık, kaza veya gebelik nedeniyle devamsızlığı, kıdemine göre belirlenen ihbar süresini altı hafta aştığında işverene bildirimsiz fesih hakkı doğar.',
    url: 'https://iskanunu.com/sizin-sorduklariniz/isveren-saglik-sebebiyle-isciyi-isten-cikartabilir-mi/',
    image_url: '/assets/bulletin/yillik-izin.jpg',
    accessed_at: '2026-08-23',
    revised_at: '2025-10-08',
    version: '1',
    status: 'onaylandi'
  },
  {
    id: 'mk21',
    source_id: 'mkay8',
    title: 'Orta Vadeli Program ve Tamamlayıcı Emeklilik Sistemi (TES)',
    content:
      'TES, Orta Vadeli Programda yol haritası olarak yer aldı; henüz yasal düzenleme yapılmadığı için katkı oranları ve işleyişe dair ayrıntılar beklenti düzeyindedir.',
    url: 'https://iskanunu.com/sizin-sorduklariniz/tamamlayici-emeklilik-sistemi-neleri-degistirecek/',
    image_url: '/assets/bulletin/bes-otomatik.jpg',
    accessed_at: '2026-08-23',
    revised_at: '2025-09-23',
    version: '1',
    status: 'onaylandi'
  },
  {
    id: 'mk22',
    source_id: 'mkay8',
    title: 'Genel tatilin hafta tatiline denk geldiği fazla çalışmada ücret',
    content:
      'Hafta tatiline denk gelen ulusal bayram ve genel tatilde çalışıldığında, Yargıtay kararları doğrultusunda bir günlük ek ücretin yanında fazla çalışılan saat için yüzde elli zamlı ücret ödenir.',
    url: 'https://iskanunu.com/sizin-sorduklariniz/30-agustos-calismasi-nasil-bordrolastirilir/',
    image_url: '/assets/bulletin/fazla-mesai.jpg',
    accessed_at: '2026-08-23',
    revised_at: '2025-08-26',
    version: '1',
    status: 'onaylandi'
  },
  {
    id: 'mk23',
    source_id: 'mkay8',
    title: '6331 sayılı Kanun — aşırı sıcakta çalışma ve fazla mesai riski',
    content:
      'İşveren, iş sağlığı ve güvenliği mevzuatı gereği çalışma ortamındaki termal riskleri değerlendirmek ve gerekli önlemleri almakla yükümlüdür; aşırı sıcakla birleşen fazla mesai iş kazası riskini yükseltir.',
    url: 'https://iskanunu.com/sizin-sorduklariniz/hava-durumuna-gore-fazla-mesai-yapilabilir-mi/',
    image_url: '/assets/bulletin/fazla-mesai.jpg',
    accessed_at: '2026-08-23',
    revised_at: '2025-08-19',
    version: '1',
    status: 'onaylandi'
  },
  {
    id: 'mk24',
    source_id: 'mkay8',
    title: 'İşten ayrılış bildirgesi ve çıkış kodu düzeltmesi',
    content:
      "İşten ayrılış bildirgesi, ayrılış tarihini takip eden on gün içinde SGK'ya verilir; aynı süre içinde sistem üzerinden düzeltilebilir veya iptal edilebilir, süre geçtiğinde dilekçeyle değişiklik talep edilir.",
    url: 'https://iskanunu.com/sizin-sorduklariniz/isten-cikis-kodu-hangi-durumlarda-ve-nasil-degistirilir/',
    image_url: '/assets/bulletin/sgk-tavan.jpg',
    accessed_at: '2026-08-23',
    revised_at: '2025-03-25',
    version: '1',
    status: 'onaylandi'
  },
  {
    id: 'mk25',
    source_id: 'mkay8',
    title: 'Kümülatif gelir vergisi matrahı ve iş değişikliğinde aktarım',
    content:
      'Kümülatif matrah, yıl içinde oluşan aylık gelir vergisi matrahlarının toplamıdır; iş değiştiren çalışan talep ederse matrahını yeni işverenine aktarabilir.',
    url: 'https://iskanunu.com/sizin-sorduklariniz/is-degistirenler-icin-vergi-matrahi-tuzak-mi/',
    image_url: '/assets/bulletin/asgari-ucret.jpg',
    accessed_at: '2026-08-23',
    revised_at: '2025-03-18',
    version: '1',
    status: 'onaylandi'
  },
  {
    id: 'mk26',
    source_id: 'mkay8',
    title: 'Geçici iş göremezlik ve çalışmadı bildirimi yükümlülüğü',
    content:
      "Çalışmadı bildirimi, SGK'dan iş göremezlik ödeneği alan çalışan için Muhtasar ve Prim Hizmet Beyannamesi yoluyla yapılır; zorunlu olduğu hâlde yapılmazsa idari para cezası uygulanır.",
    url: 'https://iskanunu.com/sizin-sorduklariniz/istirahat-suresine-iliskin-calismadi-bildirimi-gerekli-mi/',
    image_url: '/assets/bulletin/sgk-tavan.jpg',
    accessed_at: '2026-08-23',
    revised_at: '2025-03-11',
    version: '1',
    status: 'onaylandi'
  },
  {
    id: 'mk27',
    source_id: 'mkay8',
    title: 'Şubat ayında bordro hesabı ve prim günü bildirimi',
    content:
      'Aylık maktu ücretle çalışanda Şubat 28 veya 29 gün olsa da 30 günlük ücret ödenir ve eksik gün yoksa prim 30 gün bildirilir; günlük ücretle çalışanda ödeme fiilî gün sayısına göre yapılır.',
    url: 'https://iskanunu.com/sizin-sorduklariniz/subat-ayi-bordrosu-nasil-hazirlanir/',
    image_url: '/assets/bulletin/sgk-tavan.jpg',
    accessed_at: '2026-08-23',
    revised_at: '2025-02-18',
    version: '1',
    status: 'onaylandi'
  },
  {
    id: 'mk28',
    source_id: 'mkay8',
    title: 'Çocuk ve genç işçi çalıştırma usulleri',
    content:
      'On dört yaşını doldurmuş ve zorunlu ilköğretimi tamamlamış çocuklar hafif işlerde çalıştırılabilir; on beş yaşını doldurmuş ve on sekizini tamamlamamış işçi genç işçi sayılır ve çalışma koşulları ayrıca düzenlenmiştir.',
    url: 'https://iskanunu.com/sizin-sorduklariniz/cocuk-ve-genc-isci-calistirma-usulleri/',
    image_url: '/assets/bulletin/yillik-izin.jpg',
    accessed_at: '2026-08-23',
    revised_at: '2025-05-21',
    version: '1',
    status: 'onaylandi'
  },
  {
    id: 'mk29',
    source_id: 'mkay8',
    title: 'Fazla çalışma oranları ve haftalık çalışma süresi',
    content:
      'Haftalık çalışma süresi en fazla 45 saattir; 45 saati aşan her saat için yüzde elli zamlı ücret ödenir, sözleşmeyle 45 saatin altında süre belirlenen işyerlerinde 45 saate kadarki fazla çalışma için yüzde yirmi beş zam uygulanır.',
    url: 'https://iskanunu.com/sizin-sorduklariniz/fazla-mesailerin-cakismasi-mumkun-mu/',
    image_url: '/assets/bulletin/fazla-mesai.jpg',
    accessed_at: '2026-08-23',
    revised_at: '2025-04-08',
    version: '1',
    status: 'onaylandi'
  },
  {
    id: 'mk30',
    source_id: 'mkay8',
    title: 'Bayram yardımlarının bordroda gösterilmesi — ayni ve nakdî ayrımı',
    content:
      'Bayram yardımı sözleşmede öngörülmedikçe zorunlu değildir; nakdî yardımlar tüm yasal kesintilere tabidir, ayni yardımlarda ise farklı istisnalar uygulanır.',
    url: 'https://iskanunu.com/sizin-sorduklariniz/kurban-bayrami-yardimlari-nasil-bordrolastirilir/',
    image_url: '/assets/bulletin/asgari-ucret.jpg',
    accessed_at: '2026-08-23',
    revised_at: '2025-06-16',
    version: '1',
    status: 'onaylandi'
  },
  {
    id: 'mk31',
    source_id: 'mkay8',
    title: 'İşyerinde dijital takip — KVKK ilkeleri ve sınırlar',
    content:
      'KVKK, kişisel verilerin işlenmesinde ölçülülük, amaçla bağlantılılık ve veri minimizasyonu ilkelerini öngörür; işverenin izleme uygulamaları bu ilkelerle ve çalışanın özel hayatının gizliliğiyle sınırlıdır.',
    url: 'https://iskanunu.com/sizin-sorduklariniz/isvereniniz-sizi-takip-ediyor-olabilir/',
    image_url: '/assets/bulletin/guvenlik-kamerasi.jpg',
    accessed_at: '2026-08-23',
    revised_at: '2025-10-21',
    version: '1',
    status: 'onaylandi'
  }
];

// ---------- KB KAYITLARI (onaylı, yayında, verified) ----------
// Gerçek mevzuat sorularından esinlenilmiş, kendi cümlelerimizle özetlenmiş içerik.
//
// KURAL (V25): Bilgi Bankası = kaynağa dayalı GENEL mevzuat bilgisi.
//   · Yayındaki her kayıt bir mevzuat içeriğine (`source_legislation_id`) bağlıdır.
//   · Şirkete özel bilgi KB'ye girmez — yeri Sorular / şirket sayfası / know-how.
//   · Şirket sorusundan doğan kayıt, şirket bilgisinden arındırıldıktan sonra
//     KB'ye alınır (V44: onay kademesi kaldırıldı, kural yazma anında uygulanır).
// Kural api-client.js `postKBKaydi` içinde uygulanır.
export const seedArticles: Article[] = [
  {
    id: 'kb1',
    title: 'İşyeri kapanışında SGK bildirimi gerekli mi?',
    content:
      'SGK mevzuatında özel bir "kapanış bildirgesi" zorunlu değildir. Ancak çalışanların işten ayrılış bildirgeleri ve son aya ait aylık prim/hizmet belgesi zamanında ve eksiksiz gönderilmelidir. İşyeri dosyası, borç veya eksik bildirim varsa otomatik kapanmaz; kapanış öncesi borç sorgulaması yapılması ve ilgili sosyal güvenlik merkezine bilgilendirme dilekçesi verilmesi önerilir.',
    source_question_id: null,
    source_legislation_id: 'mk1',
    company_id: null,
    tag_id: ['t1'],
    verified: true,
    date: '2025-11-12',
    privacy_class: 'genel'
  },
  {
    id: 'kb2',
    title: '29 Ekim gibi ulusal bayram günlerinde çalışana ücret nasıl hesaplanır?',
    content:
      "İş Kanunu'nun 47. maddesine göre çalışılmayan ulusal bayram/genel tatil gününde normal günlük ücret tam ödenir. Çalışılırsa buna ek olarak bir günlük ücret daha ödenir — yani toplam iki günlük ücret. Hesaplamada yalnızca çıplak ücret esas alınır, yol/yemek/prim gibi yan haklar dahil edilmez. Sözleşmede hüküm yoksa çalışmak için işçinin onayı gerekir.",
    source_question_id: null,
    source_legislation_id: 'mk2',
    company_id: null,
    tag_id: ['t2'],
    verified: true,
    date: '2025-10-28',
    privacy_class: 'genel'
  },
  {
    id: 'kb3',
    title: 'Fazla mesainin bordroda yanlış gösterilmesi ne gibi bir risk oluşturur?',
    content:
      'Fazla mesainin ücretin asli unsuru gibi değerlendirilmesi ya da bordroya hiç yansıtılmaması, sonradan açılan işçilik alacağı davalarında işveren aleyhine ciddi bir risk oluşturur. Fazla mesai bedelinin bordroda ayrı bir kalem olarak, dönemsel ve tutarlı şekilde gösterilmesi gerekir.',
    source_question_id: null,
    source_legislation_id: 'mk3',
    company_id: null,
    tag_id: ['t3'],
    verified: true,
    date: '2026-07-28',
    privacy_class: 'genel'
  },
  {
    id: 'kb4',
    title: 'Arabuluculuk tutanağına rağmen işe iade davası açılabilir mi?',
    content:
      'Kural olarak arabuluculukta varılan ve tutanağa bağlanan anlaşma taraflar için bağlayıcıdır; konusu işe iade olan bir anlaşmadan sonra yeniden dava açılması genellikle mümkün değildir. İrade sakatlığı gibi istisnai durumlar somut olay bazında ayrıca değerlendirilmelidir.',
    source_question_id: null,
    source_legislation_id: 'mk4',
    company_id: null,
    tag_id: ['t4'],
    verified: true,
    date: '2026-07-28',
    privacy_class: 'genel'
  },
  {
    id: 'kb5',
    title: 'İşyerinde güvenlik kamerası kullanımı KVKK açısından nelere dikkat edilmeli?',
    content:
      'Kamera görüntüleri kişisel veri sayılır. Kayıt alanı orantılı belirlenmeli (dinlenme alanı gibi mahremiyet gerektiren yerler dışında tutulmalı), çalışanlar bilgilendirilmeli ve aydınlatma metni sağlanmalıdır. Görüntülerin saklama süresi ve erişim yetkisi de net tanımlanmalıdır.',
    source_question_id: null,
    source_legislation_id: 'mk5',
    company_id: null,
    tag_id: ['t5'],
    verified: true,
    date: '2026-07-28',
    privacy_class: 'genel'
  },
  {
    id: 'kb6',
    title: "18 yaşından küçük sigortalı çalışanlar otomatik BES'e dahil edilir mi?",
    content:
      'Otomatik BES sistemi belirli bir yaş aralığındaki çalışanlar için işverence uygulanır; 18 yaşından küçük sigortalılar bu kapsamın dışındadır, sisteme dahil edilmeleri gerekmez.',
    source_question_id: null,
    source_legislation_id: 'mk6',
    company_id: null,
    tag_id: ['t6'],
    verified: true,
    date: '2025-10-09',
    privacy_class: 'genel'
  },
  {
    id: 'kb7',
    title: 'SGK prime esas kazanç tavanını aşan ödemeler bordroya nasıl yansıtılmalı?',
    content:
      'Tavanı aşan kısım için SGK primi kesilmez, ancak gelir vergisi matrahına dahil edilmeye devam eder. Bordroda brüt ücretin tavanı aşan kısmı ayrıştırılarak, prim ve vergi matrahlarının doğru hesaplandığından emin olunmalıdır.',
    source_question_id: null,
    source_legislation_id: 'mk7',
    company_id: null,
    tag_id: ['t7'],
    verified: true,
    date: '2025-09-24',
    privacy_class: 'genel'
  },
  {
    id: 'kb8',
    title: 'Yıllık izin kullanımında nelere dikkat edilmeli?',
    content:
      'İzin, çalışanın kıdemine göre belirlenen asgari sürelerin altında kullandırılamaz. İzin talebi yazılı alınmalı, izin kaydı tutulmalı; iş sözleşmesi sona erdiğinde kullanılmayan izin ücrete dönüştürülmelidir.',
    source_question_id: null,
    source_legislation_id: 'mk8',
    company_id: null,
    tag_id: ['t8'],
    verified: true,
    date: '2025-07-08',
    privacy_class: 'genel'
  },
  // GENİŞLETME (V9): Bilgi Bankası ekranının (FR-21) dolu görünmesi için
  {
    id: 'kb9',
    title: 'Kıdem tazminatı hesabında hangi ödemeler dikkate alınır?',
    content:
      'Kıdem tazminatı, giydirilmiş brüt ücret üzerinden hesaplanır: çıplak ücrete ek olarak süreklilik arz eden yol, yemek, ikramiye gibi ödemeler de dahil edilir. Arızi nitelikteki ödemeler hesaba katılmaz. Hesaplanan tutar, ilgili dönemin kıdem tazminatı tavanı ile sınırlıdır.',
    source_question_id: null,
    source_legislation_id: 'mk12',
    company_id: null,
    tag_id: ['t10'],
    verified: true,
    date: '2026-06-15',
    privacy_class: 'genel'
  },
  {
    id: 'kb10',
    title: 'İhbar öneli süreleri kıdeme göre nasıl belirlenir?',
    content:
      'İş Kanunu m.17 uyarınca ihbar öneli kıdeme bağlıdır: 6 aya kadar 2 hafta, 6 ay–1,5 yıl arası 4 hafta, 1,5–3 yıl arası 6 hafta, 3 yıldan fazla kıdemde 8 haftadır. Bu süreler asgari olup sözleşmeyle artırılabilir, azaltılamaz.',
    source_question_id: null,
    source_legislation_id: 'mk13',
    company_id: null,
    tag_id: ['t11'],
    verified: true,
    date: '2026-05-20',
    privacy_class: 'genel'
  },
  // NOT (V25): "Işıldak Lojistik puantaj gönderim takvimi" kaydı buradan kaldırıldı.
  // Şirkete özel operasyonel bilgi Bilgi Bankası'na girmez; aynı bilgi zaten
  // `kh1` know-how notu olarak şirket sayfasının akışında duruyor.
  // V44: Bu üç kayıt eskiden onay kuyruğunu doldurmak için 'onay_bekliyor'
  // durumundaydı. Onay kademesi kaldırıldığında doğrudan yayına alındılar.
  // biri uzman girdisi, ikisi scraper (mevzuat taraması) kaynaklı.
  // AI cevaplarından türeyen kayıt kuyruğa düşmez.
  {
    id: 'kb12',
    title: 'Doğum izni sonrası SGK eksik gün kodu nasıl seçilir?',
    content:
      'Doğum izni (analık hâli) nedeniyle çalışılmayan günlerde eksik gün gerekçesi olarak ilgili istirahat/analık kodu bildirilir. Kodun yanlış seçilmesi teşvik kaybına ve idari para cezasına yol açabileceği için, rapor tarihleriyle puantajın birebir örtüşmesi kontrol edilmelidir.',
    source_question_id: null,
    source_legislation_id: 'mk11',
    source_kind: 'uzman_girdisi',
    // V25: kayıt bir şirket sorusundan doğdu ama KB'ye şirket bilgisinden
    // arındırılmış hâlde giriyor — genel mevzuat bilgisi olarak.
    company_id: null,
    tag_id: ['t1', 't13'],
    verified: true,
    date: '2026-08-19',
    privacy_class: 'genel'
  },
  {
    id: 'kb13',
    title: '2026 yılı asgari ücret tutarları',
    content:
      'Asgari Ücret Tespit Komisyonu kararıyla belirlenen brüt/net asgari ücret ve işveren maliyeti tutarları yayımlandı. Parametre bazlı bir içerik olduğu için dönem/yıl bilgisiyle birlikte versiyonlanmalıdır (bkz. Mimari §5, K kuralı 5).',
    source_question_id: null,
    source_legislation_id: 'mk9',
    company_id: null,
    tag_id: ['t12'],
    verified: true,
    date: '2026-08-17',
    privacy_class: 'genel'
  },
  {
    id: 'kb14',
    title: 'Çalışan verilerinde aydınlatma metni yükümlülüğü',
    content:
      'İşveren, çalışan kişisel verilerinin hangi amaçla işlendiğini, kimlere aktarılabileceğini ve saklama süresini aydınlatma metninde açıkça belirtmek zorundadır. Metnin çalışana tebliğ edildiğinin kayıtla ispatlanabilir olması önerilir.',
    source_question_id: null,
    source_legislation_id: 'mk10',
    company_id: null,
    tag_id: ['t5'],
    verified: true,
    date: '2026-08-14',
    privacy_class: 'genel'
  },
  // GENİŞLETME (V26): iskanunu.com "Sizin Sorduklarınız" köşesindeki gerçek
  // sorulardan türeyen 18 kayıt. Her biri mk14–mk31 mevzuat içeriklerine bağlı;
  // içerikler kendi cümlelerimizle özetlenmiştir (bkz. dosya başlığı).
  {
    id: 'kb16',
    title: '1 Mayıs Cuma gününe denk gelirse takip eden Cumartesi genel tatil sayılır mı?',
    content:
      "1 Mayıs, 2429 sayılı Kanun kapsamında genel tatildir: çalışılmazsa günlük ücret tam ödenir, çalışılırsa bir günlük ücret daha eklenir. Takip eden Cumartesi için 2429 sayılı Kanun'da yer alan hüküm, Cumartesi öğlene kadar çalışılan döneme aitti ve amacı genel tatil ile hafta tatili arasında kesintisiz dinlenme sağlamaktı. Bugün haftada beş gün çalışılan işyerlerinde Cumartesi zaten çalışma günü olmadığı için ayrı bir genel tatil ücreti doğmaz; altı gün çalışılan işyerlerinde ise Cumartesi gününün nasıl değerlendirileceği işyerinin çalışma düzenine göre belirlenir.",
    source_question_id: null,
    source_legislation_id: 'mk14',
    source_kind: 'mevzuat_taramasi',
    company_id: null,
    tag_id: ['t2', 't27'],
    verified: true,
    date: '2026-04-30',
    privacy_class: 'genel'
  },
  {
    id: 'kb17',
    title: 'Çalışanın işyerinde ChatGPT kullanması işten çıkarma nedeni olur mu?',
    content:
      'Tek başına otomatik bir fesih nedeni değildir. Belirleyici olan, sisteme girilen verinin niteliğidir: kişisel veri, müşteri bilgisi, bordro verisi veya ticari sır girilmesi, işverenin açık talimatına aykırı davranılması, çalışanın pozisyonu ve gizlilik yükümlülüğü somut olayda ciddi iş hukuku sonuçları doğurabilir. Değerlendirme, işçinin özen ve sadakat borcu ile işverenin haklı menfaatlerinin korunması ilkeleri çerçevesinde yapılır. İşyerinde yapay zekâ kullanımına dair yazılı bir politika bulunması ve çalışanların bilgilendirilmesi riski belirgin şekilde azaltır.',
    source_question_id: null,
    source_legislation_id: 'mk15',
    source_kind: 'mevzuat_taramasi',
    company_id: null,
    tag_id: ['t5', 't18', 't16'],
    verified: true,
    date: '2026-04-10',
    privacy_class: 'genel'
  },
  {
    id: 'kb18',
    title: 'Zam oranları belirlenirken eşitlik ilkesi nasıl uygulanır?',
    content:
      'Eşitlik ilkesi, herkese aynı oranda zam yapılması anlamına gelmez. İş Kanunu m.5, benzer nitelikte iş yapan ve benzer performans gösteren çalışanlar arasında geçerli ve objektif bir sebep olmadan farklı oran uygulanmasını yasaklar; böyle bir uygulama eşit davranma borcunun ihlali sayılabilir. Performans, kıdem ve görev farkı gibi ölçülebilir kriterlere dayanan farklılaştırma ise meşrudur. Kriterleri yazılı ve önceden belli olan bir zam politikası hem ihlal riskini hem de çalışan itirazlarını azaltır.',
    source_question_id: null,
    source_legislation_id: 'mk16',
    source_kind: 'mevzuat_taramasi',
    company_id: null,
    tag_id: ['t19'],
    verified: true,
    date: '2025-11-06',
    privacy_class: 'genel'
  },
  {
    id: 'kb19',
    title: 'İşe iade arabuluculuğunda asıl işveren ve alt işverenin birlikte katılması zorunlu mu?',
    content:
      "Artık zorunlu değil. 7036 sayılı Kanun m.3/15, asıl işveren-alt işveren ilişkisinde işe iade arabuluculuğunun ancak iki işverenin birlikte katılması ve iradelerinin birbirine uygun olmasıyla sonuçlanabileceğini öngörüyordu. Anayasa Mahkemesi bu şartı ölçülülük ilkesine aykırı bularak iptal etti; karar 17 Ekim 2025 tarihli Resmî Gazete'de yayımlandı. Gerekçe, arabuluculuğun tarafların serbest iradesine dayanması ve birlikte katılım zorunluluğunun süreci fiilen tıkamasıydı.",
    source_question_id: null,
    source_legislation_id: 'mk17',
    source_kind: 'mevzuat_taramasi',
    company_id: null,
    tag_id: ['t4', 't20'],
    verified: true,
    date: '2025-11-06',
    privacy_class: 'genel'
  },
  {
    id: 'kb20',
    title: 'Kısmi zamanlı çalışan tam zamanlıya geçerken hangi bildirimler yapılır?',
    content:
      'Önce sözleşme tarafı düzeltilir: mevcut sözleşmeye ek protokol yapılır veya sözleşme yeniden düzenlenir ve yeni çalışma koşulları açıkça yazılır. SGK tarafında işten çıkış ve yeniden giriş işlemi yapılmaz; işe giriş bildirgesi güncelleme ekranından kısmi süreli çalışmayı gösteren seçenek Hayır olarak güncellenir ve çalışılacak gün sayısı boş bırakılır. Kısmi süreli çalışanın haftalık süresi tam süreli çalışanın üçte ikisini, yani 30 saati aşamaz ve kısmi süreli çalışana fazla mesai yaptırılamaz. Bu nedenle bildirim güncellenmezse fazla mesai kaydı denetimde mevzuata aykırı çalışma gibi görünür ve idari para cezası riski doğar.',
    source_question_id: null,
    source_legislation_id: 'mk18',
    source_kind: 'mevzuat_taramasi',
    company_id: null,
    tag_id: ['t1', 't21'],
    verified: true,
    date: '2025-10-29',
    privacy_class: 'genel'
  },
  {
    id: 'kb21',
    title: 'Ücretli ve ücretsiz izin türleri nelerdir?',
    content:
      'Ücretli izinlerin başında yıllık ücretli izin, doğum izinleri ve mazeret izinleri gelir. Yıllık izin, aynı işverene bağlı bir yıllık kıdemin tamamlanmasıyla doğar ve İş Kanunu m.53 uyarınca 1-5 yıl kıdem için 14 gün, 5 yıldan fazla ve 15 yıldan az kıdem için 20 gün, 15 yıl ve üzeri için 26 gündür. Bu süreler asgaridir ve sözleşmeyle artırılabilir; yer altında çalışanlara dörder gün eklenir, 18 yaş ve altı ile 50 yaş ve üzeri işçilerde izin 20 günden az olamaz. Doğum izni doğumdan önce ve sonra sekiz hafta olarak kullanılır, çoğul gebelikte öncesine iki hafta eklenir; doğuma üç hafta kalana dek çalışılması hâlinde kullanılmayan süre doğum sonrasına aktarılır.',
    source_question_id: null,
    source_legislation_id: 'mk19',
    source_kind: 'mevzuat_taramasi',
    company_id: null,
    tag_id: ['t8', 't13'],
    verified: true,
    date: '2025-10-16',
    privacy_class: 'genel'
  },
  {
    id: 'kb22',
    title: 'İşveren sağlık sebebiyle işçiyi işten çıkarabilir mi?',
    content:
      'Çıkarabilir, ancak keyfî olamaz. İş Kanunu m.25/I-b, sağlık durumunun işe devamı imkânsız kıldığı hâllerde işverene haklı nedenle fesih hakkı verir. Bunun için durumun yetkili sağlık kurulu raporuyla belgelenmesi ve işverenin öncelikle çalışanı aynı şirkette başka bir göreve yerleştirme imkânını araştırması beklenir. Uzun süreli raporlarda, devamsızlığın işçinin kıdemine göre belirlenen ihbar süresini altı hafta aşması hâlinde bildirimsiz fesih hakkı doğar; doğumda bu süre doğum izinlerinin bitiminden sonra işlemeye başlar. Sık sık kısa rapor alınması gibi hâllerde de aynı belgeleme ve alternatif görev araştırması adımları izlenmelidir.',
    source_question_id: null,
    source_legislation_id: 'mk20',
    source_kind: 'mevzuat_taramasi',
    company_id: null,
    tag_id: ['t16', 't23'],
    verified: true,
    date: '2025-10-10',
    privacy_class: 'genel'
  },
  {
    id: 'kb23',
    title: 'Tamamlayıcı Emeklilik Sistemi (TES) neleri değiştirecek?',
    content:
      "TES henüz yasalaşmadı; Orta Vadeli Programda tavsiye ve yol haritası niteliğinde yer alıyor, dolayısıyla aşağıdaki başlıklar beklenti düzeyindedir. Kurgu, otomatik katılım kapsamındaki 4/A ve 4/C statüsündeki çalışanları kapsıyor, 4/B kapsam dışında. Çalışan ve işverenden yüzde üç oranında kesinti ile fona aktarım, toplam katkının yüzde otuzu oranında da devlet desteği bekleniyor. BES'ten temel farkı daha zorunlu bir yapı olması: cayma hakkı öngörülmüyor, sistemden tam çıkış emeklilik döneminin sona ermesi, ölüm veya maluliyet hâllerine bağlı. Fon seçimi ve birikimin fonlar arasındaki dağılımı çalışanda olacak.",
    source_question_id: null,
    source_legislation_id: 'mk21',
    source_kind: 'mevzuat_taramasi',
    company_id: null,
    tag_id: ['t6'],
    verified: true,
    date: '2025-09-25',
    privacy_class: 'genel'
  },
  {
    id: 'kb24',
    title: 'Resmî tatil hafta tatiline denk geldiğinde çalışma nasıl bordrolaştırılır?',
    content:
      "Resmî tatilde çalışılmazsa işçi o günün ücretine çalışma karşılığı olmaksızın hak kazanır. Çalışılırsa yasa gereği yüzde yüz zamlı ödeme yapılır: maaş içindeki günlük ücretin yanına bir günlük ücret daha eklenir. Sık karıştırılan nokta, tatil gününde bir saat bile çalışılsa bir günlük ek ücretin doğmasıdır. Resmî tatil hafta tatiline denk geldiğinde çakışma oluşur; İş Kanunu'nda açık hüküm bulunmamakla birlikte Yargıtay kararları, bir günlük ek ücretin yanında fazla çalışılan saat için yüzde elli zamlı ücret ödenerek toplamda iki buçuk katı ücrete ulaşılması yönündedir.",
    source_question_id: null,
    source_legislation_id: 'mk22',
    source_kind: 'mevzuat_taramasi',
    company_id: null,
    tag_id: ['t2', 't3'],
    verified: true,
    date: '2025-08-28',
    privacy_class: 'genel'
  },
  {
    id: 'kb25',
    title: 'Aşırı sıcak havada fazla mesai yaptırılabilir mi?',
    content:
      'Fazla mesai kendiliğinden yasak değildir, ancak aşırı sıcak ortamda iş sağlığı ve güvenliği yükümlülükleri öne geçer. Yüksek sıcaklık dehidrasyon, ısı çarpması ve dikkat dağınıklığı yoluyla iş kazası riskini artırır; fazla çalışmayla birleştiğinde yorgunluk hızlanır, hata ve kaza oranı yükselir. 6331 sayılı Kanun kapsamında işveren risk değerlendirmesini termal koşulları da kapsayacak şekilde güncellemek, çalışma saatlerini günün en sıcak dilimlerinden kaydırmak, dinlenme ve sıvı erişimi sağlamak ve özellikle dış mekân işlerinde fazla çalışmayı sınırlamakla yükümlüdür.',
    source_question_id: null,
    source_legislation_id: 'mk23',
    source_kind: 'mevzuat_taramasi',
    company_id: null,
    tag_id: ['t3', 't17'],
    verified: true,
    date: '2025-08-21',
    privacy_class: 'genel'
  },
  {
    id: 'kb26',
    title: 'İşten çıkış kodu hangi durumlarda ve nasıl değiştirilir?',
    content:
      "İşten ayrılış bildirgesi, ayrılış tarihini takip eden on günlük süre içinde SGK'ya verilir ve aynı süre içinde sistem üzerinden düzeltilebilir veya iptal edilebilir. Süre geçtiyse SGK'ya dilekçe ile çıkış kodu değişikliği talep edilir. Düzeltme, aylık prim ve hizmet belgesiyle uyumlu olmalıdır. Kodun doğruluğu iş mahkemelerinde belirleyicidir: çıkış kodu hem fesih nedeniyle hem de yapılan çıkış ödemeleriyle uyumlu olmalıdır. Örneğin istifa koduyla çıkış verilip kıdem tazminatı ödenmesi çelişki yaratır; kıdem tazminatı ödenecekse kod mutlaka revize edilmelidir. İşe iade davası ve arabuluculuk sonrası değişen fesih nedenlerinde de kodun güncellenmesi gerekir.",
    source_question_id: null,
    source_legislation_id: 'mk24',
    source_kind: 'mevzuat_taramasi',
    company_id: null,
    tag_id: ['t26', 't1'],
    verified: true,
    date: '2025-03-27',
    privacy_class: 'genel'
  },
  {
    id: 'kb27',
    title: 'Yıl içinde iş değiştirende kümülatif vergi matrahı nasıl işler?',
    content:
      'Kümülatif gelir vergisi matrahı, çalışanın yıl boyunca oluşan aylık matrahlarının toplamıdır; toplam büyüdükçe uygulanan vergi dilimi yükselir ve net ücret düşer. Yıl içinde iş değiştiren çalışan talep ederse matrahını yeni işverenine aktarabilir; bu durumda yeni işveren vergiyi önceki işyerinde oluşan matrahı da dikkate alarak hesaplar, dolayısıyla aylık kesinti artar. Sık yapılan hata, aktarımın beyanname yükümlülüğünü ortadan kaldırdığını düşünmektir: yıl içinde birden fazla işverenden ücret geliri elde eden çalışan, toplam belirli bir sınırı aştığında yıllık gelir vergisi beyannamesi vermek zorundadır. Matrah taşınmadığında ise fark beyanname aşamasında ortaya çıkar.',
    source_question_id: null,
    source_legislation_id: 'mk25',
    source_kind: 'mevzuat_taramasi',
    company_id: null,
    tag_id: ['t22', 't14'],
    verified: true,
    date: '2025-03-20',
    privacy_class: 'genel'
  },
  {
    id: 'kb28',
    title: 'İstirahat süresi için çalışmadı bildirimi gerekli mi?',
    content:
      "Gerekli olduğu hâller: çalışanın SGK'dan geçici iş göremezlik raporu alması, rapor süresinin en az üç gün olması, raporun iş kazası, meslek hastalığı veya hastalık nedeniyle alınmış olması ve kadın çalışanların doğum öncesi ile sonrası izinlerini kapsayan raporlar. Gerekmediği hâller: iki günü aşmayan kısa süreli raporlar, özel sağlık kuruluşundan alınıp SGK sistemine işlenmeyen raporlar, çalışanın raporlu süre boyunca fiilen çalışmaya devam ettiği durumlar ve ücretsiz izne denk gelen raporlar. Bildirim, Muhtasar ve Prim Hizmet Beyannamesi ile yapılır; zorunlu olduğu hâlde yapılmazsa aylık asgari ücretin onda biri oranında idari para cezası uygulanır.",
    source_question_id: null,
    source_legislation_id: 'mk26',
    source_kind: 'mevzuat_taramasi',
    company_id: null,
    tag_id: ['t1', 't23'],
    verified: true,
    date: '2025-03-13',
    privacy_class: 'genel'
  },
  {
    id: 'kb29',
    title: 'Şubat ayı bordrosu nasıl hazırlanır?',
    content:
      "Aylık maktu ücretle çalışan ve eksik günü olmayan işçiye, Şubat 28 veya 29 gün sürse de 30 günlük ücret ödenir ve SGK'ya prim günü 30 gün bildirilir. Günlük ücretle çalışanda ödeme fiilî gün sayısına göre yapılır: 28 gün çalıştıysa 28, 29 gün çalıştıysa 29 günlük ücret. Ancak eksik günü yoksa prim günü yine 30 gün bildirilir. Bu durumda 28 veya 29 günlük ücret 30 günlük asgari ücretin altında kalıyorsa, prime esas kazanç 30 günlük asgari ücrete tamamlanarak bildirilir ve eklenen farkın işçi ile işveren payı hesaba katılır. Hastalık izni, ücretsiz izin, ay ortasında işe giriş veya nakil gibi hâllerde hesap değişir; bu kalemler ayrıca kontrol edilmelidir.",
    source_question_id: null,
    source_legislation_id: 'mk27',
    source_kind: 'mevzuat_taramasi',
    company_id: null,
    tag_id: ['t14', 't9'],
    verified: true,
    date: '2025-02-20',
    privacy_class: 'genel'
  },
  {
    id: 'kb30',
    title: 'Çocuk ve genç işçi çalıştırmanın koşulları nelerdir?',
    content:
      'Temel eğitimini tamamlamış, 14 yaşını bitirmiş ve 15 yaşını doldurmamış işçi çocuk işçi; 15 yaşını doldurmuş ve 18 yaşını tamamlamamış işçi genç işçi sayılır. On beş yaşını doldurmamış çocukların çalıştırılması kural olarak yasaktır; on dört yaşını doldurmuş ve zorunlu ilköğretim çağını tamamlamış çocuklar, bedensel, zihinsel, sosyal ve ahlaki gelişimlerine ve okula devamlarına engel olmayan hafif işlerde çalıştırılabilir. On dört yaşını doldurmamış çocuklar ise yalnızca sanat, kültür ve reklam faaliyetlerinde, yazılı sözleşme yapılması ve her faaliyet için ayrı izin alınması şartıyla çalıştırılabilir. Çocuk ve genç işçilerin çalışma saatleri, çalıştırılabilecekleri işler ve bazı hakları diğer sigortalılardan farklı düzenlenmiştir; işe alınmadan önce sağlık raporu alınması zorunludur.',
    source_question_id: null,
    source_legislation_id: 'mk28',
    source_kind: 'mevzuat_taramasi',
    company_id: null,
    tag_id: ['t24'],
    verified: true,
    date: '2025-05-23',
    privacy_class: 'genel'
  },
  {
    id: 'kb31',
    title: 'Fazla mesai oranları nasıl hesaplanır, fazla mesailer çakışabilir mi?',
    content:
      'Haftalık çalışma süresi en fazla 45 saattir, sözleşmeyle daha düşük belirlenebilir. Haftalık süresini tamamlayan işçiye kesintisiz 24 saat hafta tatili verilmesi esastır. Haftalık süresi 45 saat olan işyerinde, hafta içi veya hafta tatilinde 45 saati aşan her saat için saatlik ücretin yüzde elli zamlı hâli ödenir. Sözleşmeyle haftalık süre 45 saatin altında belirlenmişse, 45 saate kadar olan fazla çalışmalar için yüzde yirmi beş, 45 saati aşan kısım için yüzde elli zam uygulanır. Kanundaki oranlar asgari olup sözleşmeyle daha yüksek belirlenebilir. Ulusal bayram ve genel tatil çalışmaları da ayrıca zamlı ödendiği için bu günlerde yapılan fazla çalışmada iki kalem birlikte hesaplanır.',
    source_question_id: null,
    source_legislation_id: 'mk29',
    source_kind: 'mevzuat_taramasi',
    company_id: null,
    tag_id: ['t3', 't27'],
    verified: true,
    date: '2025-04-10',
    privacy_class: 'genel'
  },
  {
    id: 'kb32',
    title: 'Bayram yardımları bordroda nasıl gösterilir?',
    content:
      'Bayram yardımı bir ek menfaattir; iş sözleşmesinde veya toplu sözleşmede yer almadıkça zorunlu değildir, yer alıyorsa zorunlu hâle gelir. Yardımın bordroya eklenmesi gerekir ve vergi ile prim sonucu, yardımın ayni mi nakdî mi olduğuna göre değişir. Nakdî yardım, ücrete ek olarak banka hesabı üzerinden ödenen tutardır ve tüm yasal kesintilere tabidir, istisnası yoktur; kurban kesmesi için nakit verilen tutar da bu kapsamdadır. Ayni yardım ise hediye çeki, market çeki veya gıda paketi gibi çalışanın nakde dönüştüremeyeceği menfaatlerdir ve farklı istisnalara tabidir. Bu nedenle yardımın türü bordroda doğru ayrıştırılarak gösterilmelidir.',
    source_question_id: null,
    source_legislation_id: 'mk30',
    source_kind: 'mevzuat_taramasi',
    company_id: null,
    tag_id: ['t25', 't14'],
    verified: true,
    date: '2025-06-18',
    privacy_class: 'genel'
  },
  {
    id: 'kb33',
    title: 'İşveren çalışanı dijital olarak takip edebilir mi?',
    content:
      'İşverenin yönetim hakkı, çalışanın özel hayatının gizliliği, haberleşme özgürlüğü ve kişisel verilerin korunmasına ilişkin hükümlerle sınırlıdır. E-posta, konum verisi ve dijital giriş-çıkış kaydı gibi verilerin işlenmesi KVKK kapsamındadır ve ölçülülük, amaçla bağlantılılık ile veri minimizasyonu ilkelerine uymak zorundadır: izlenen veri amaçla sınırlı ve gereken ölçüde olmalı, daha az müdahaleci bir yöntem varsa o tercih edilmelidir. Uygulamada çalışanların önceden aydınlatılması, izleme kapsamının ve saklama süresinin yazılı olarak belirlenmesi ve erişim yetkisinin sınırlandırılması beklenir.',
    source_question_id: null,
    source_legislation_id: 'mk31',
    source_kind: 'mevzuat_taramasi',
    company_id: null,
    tag_id: ['t5'],
    verified: true,
    date: '2025-10-23',
    privacy_class: 'genel'
  }
];

// ---------- ÖRNEK SORULAR (farklı durumlarda, demo akışı için) ----------
// NOT (V8): Orijinal iki kaydın tarihleri tarih-only idi; FR-14b (uzman bazlı
// ortalama cevaplama süresi) hesaplanabilsin diye yeni kayıtlar ISO datetime
// kullanır. Tarih-only kayıtlarda saat 09:00 varsayılır (bkz. api-client.js).
export const seedQuestions: Question[] = [
  {
    id: 'q1',
    text: "Işıldak Lojistik'te bir çalışanın doğum izni sonrası bordrosunda SGK eksik gün kodu ne olmalı?",
    asker_id: 'u2',
    company_id: 's2',
    tag_id: ['t1'],
    status: 'eskale_edildi', // demo: ortak havuzda bekliyor
    created_at: '2026-08-18',
    // GENİŞLETME (V33): Havuz konsolu bekleme süresini eskalasyon anından
    // ölçer (api-client getHavuz). Önceden yoktu ve created_at'e düşülüyordu.
    escalated_at: '2026-08-18T09:35:00',
    privacy_class: 'sirkete_ozel'
  },
  {
    id: 'q2',
    text: "Ergene Tekstil'de 29 Ekim'de çalışan mavi yaka personele nasıl ücret ödeyeceğiz?",
    asker_id: 'u1',
    company_id: 's1',
    tag_id: ['t2'],
    status: 'cozuldu', // demo: otomatik cevapla çözüldü
    created_at: '2026-08-15',
    privacy_class: 'sirkete_ozel'
  },
  // GENİŞLETME (V9): Sorular ekranı (FR-24) ve metriklerin anlamlı olması için
  {
    id: 'q3',
    text: 'Kıdem tazminatı hesabında yol ve yemek yardımı dikkate alınır mı?',
    // V41: soran u3 (Göksel Bey) idi — Bilgi Uzmanı cevaplayan taraf olduğu için
    // soru sahibi bir Müşteri Temsilcisine çevrildi.
    asker_id: 'u2',
    company_id: null,
    tag_id: ['t10'],
    status: 'cozuldu',
    created_at: '2026-08-12T10:15:00',
    privacy_class: 'genel'
  },
  {
    id: 'q4',
    text: "Kaya Otomotiv'de vardiyalı çalışanın fazla mesai üst sınırı nasıl takip edilmeli?",
    // V41: soran u4 (Tuğçe Kulaksız) idi — Bilgi Uzmanı. Kaya Otomotiv'in MT'si.
    asker_id: 'u6',
    company_id: 's3',
    tag_id: ['t3', 't9'],
    status: 'eskale_edildi',
    created_at: '2026-08-19T14:40:00',
    escalated_at: '2026-08-19T15:02:00',
    privacy_class: 'sirkete_ozel'
  },
  {
    id: 'q5',
    text: "Ahmet Korkmaz'ın maaş bordrosunda SGK tavanı aşımı görünüyor, nasıl düzeltilir?",
    asker_id: 'u5',
    company_id: 's1',
    tag_id: ['t7', 't14'],
    status: 'cozuldu',
    created_at: '2026-08-13T09:20:00',
    privacy_class: 'kisisel_veri' // V3: maskeleme demo edilebilsin diye bilinçli
  },
  {
    id: 'q6',
    text: 'Yeni işe alınan yabancı uyruklu çalışan için çalışma izni süreci nasıl işliyor?',
    asker_id: 'u6',
    company_id: null,
    tag_id: [],
    // V41: durum "otomatik_cevaplandi" idi ama tek cevap kaydı "bilgi
    // bulunamadı" denemesiydi — 03 §3'e göre eşleşme yoksa soru havuza düşer.
    status: 'eskale_edildi',
    created_at: '2026-08-20T11:05:00',
    escalated_at: '2026-08-20T11:12:00',
    privacy_class: 'genel'
  },
  {
    id: 'q7',
    text: 'Demir İnşaat için puantaj şablonu hangi formatta gönderiliyor?',
    asker_id: 'u7',
    company_id: 's5',
    tag_id: ['t9'],
    status: 'eskale_edildi',
    created_at: '2026-08-21T16:30:00',
    escalated_at: '2026-08-21T16:52:00',
    privacy_class: 'sirkete_ozel'
  },
  {
    id: 'q8',
    text: 'İhbar öneli içinde yıllık izin kullandırılabilir mi?',
    asker_id: 'u1',
    company_id: null,
    tag_id: ['t11', 't8'],
    status: 'cozuldu',
    created_at: '2026-08-11T13:00:00',
    privacy_class: 'genel'
  },
  {
    id: 'q9',
    text: "Işıldak Lojistik'te asgari ücret desteği hangi aylarda uygulanacak?",
    asker_id: 'u2',
    company_id: 's2',
    tag_id: ['t12'],
    status: 'eskale_edildi',
    created_at: '2026-08-21T09:45:00',
    escalated_at: '2026-08-21T10:10:00',
    privacy_class: 'sirkete_ozel'
  },
  {
    id: 'q10',
    text: 'Güvenlik kamerası kayıtlarını ne kadar süre saklayabiliriz?',
    asker_id: 'u1', // V41: soran u3 (Bilgi Uzmanı) idi
    company_id: null,
    tag_id: ['t5'],
    status: 'cozuldu',
    created_at: '2026-08-14T15:10:00',
    privacy_class: 'genel'
  },
  // GENİŞLETME (V33): Havuz konsolunda SLA kademelerinin (zamanında / uyarı /
  // kritik) üçü birden görünebilsin diye kuyruğa iki taze eskalasyon.
  {
    id: 'q11',
    text: "Ergene Tekstil'de kısmi süreli çalışanın yıllık izin hakkı tam süreli çalışan gibi mi hesaplanıyor?",
    asker_id: 'u1',
    company_id: 's1',
    tag_id: ['t21', 't8'],
    status: 'eskale_edildi',
    created_at: '2026-08-22T16:30:00',
    escalated_at: '2026-08-22T16:47:00',
    privacy_class: 'sirkete_ozel'
  },
  {
    id: 'q12',
    text: "İstirahat raporu biten çalışanın işe dönüş gününde SGK'ya ayrı bir bildirim yapılıyor mu?",
    asker_id: 'u6',
    company_id: null,
    tag_id: ['t23', 't1'],
    status: 'eskale_edildi',
    created_at: '2026-08-23T17:20:00',
    escalated_at: '2026-08-23T17:41:00',
    privacy_class: 'genel'
  },
  // ═══ GENİŞLETME (V41) — Sorular ekranı üç sayfalık gerçekçi hacimle çalışsın
  // diye 21 kayıt. Kurallar: (a) soran her zaman bir Müşteri Temsilcisi ya da
  // Admin'dir, Bilgi Uzmanı DEĞİLDİR — uzman cevaplayan taraftır; (b) şirkete
  // özel soruyu yalnızca o şirketin MT'si sorar (Ç8 erişim kuralıyla tutarlı);
  // (c) "eskale_edildi" kayıtların uzman cevabı YOKTUR — yalnızca Dasi'nin
  // sonuçsuz denemesi vardır (bulunamadi: true).

  // ── Uzman havuzunda bekleyenler ──
  {
    id: 'q13',
    text: "Ergene Tekstil'de mavi yaka personele verilen bayram ikramiyesi bordroda hangi kalemde gösterilecek?",
    asker_id: 'u8',
    company_id: 's1',
    tag_id: ['t25', 't14'],
    status: 'eskale_edildi',
    created_at: '2026-08-22T10:20:00',
    escalated_at: '2026-08-22T10:44:00',
    privacy_class: 'sirkete_ozel'
  },
  {
    id: 'q14',
    text: 'İşten çıkış kodu 34 ile 04 arasındaki fark işsizlik ödeneğini nasıl etkiliyor?',
    asker_id: 'u6',
    company_id: null,
    tag_id: ['t26', 't16'],
    status: 'eskale_edildi',
    created_at: '2026-08-23T11:05:00',
    escalated_at: '2026-08-23T11:26:00',
    privacy_class: 'genel'
  },
  {
    id: 'q15',
    text: "Kaya Otomotiv'de genç işçi statüsündeki çalışan gece vardiyasında çalıştırılabilir mi?",
    asker_id: 'u1',
    company_id: 's3',
    tag_id: ['t24', 't9'],
    status: 'eskale_edildi',
    created_at: '2026-08-20T09:15:00',
    escalated_at: '2026-08-20T09:38:00',
    privacy_class: 'sirkete_ozel'
  },
  {
    id: 'q16',
    text: "Işıldak Lojistik'te şoförlerin hafta tatili, yolda geçen süre nedeniyle nasıl hesaplanıyor?",
    asker_id: 'u2',
    company_id: 's2',
    tag_id: ['t27', 't9'],
    status: 'eskale_edildi',
    created_at: '2026-08-21T15:40:00',
    escalated_at: '2026-08-21T16:02:00',
    privacy_class: 'sirkete_ozel'
  },

  // ── V43: "Açık" ara durumu kaldırıldı. Yeni soru oluşturulduğunda kayıt
  //   doğrudan ortak uzman havuzuna düşer; bu blok da eskale_edildi olarak durur.
  {
    id: 'q17',
    text: 'Yıllık izin ücretinin bordroda ayrı kalem olarak gösterilmesi zorunlu mu?',
    asker_id: 'u1',
    company_id: null,
    tag_id: ['t8', 't14'],
    status: 'eskale_edildi',
    created_at: '2026-08-24T09:05:00',
    escalated_at: '2026-08-24T09:27:00',
    privacy_class: 'genel'
  },
  {
    id: 'q18',
    text: "Demir İnşaat'ta taşeron çalışanların İSG eğitim kayıtları bizim dosyamızda mı tutulacak?",
    asker_id: 'u6',
    company_id: 's5',
    tag_id: ['t17'],
    status: 'eskale_edildi',
    created_at: '2026-08-23T14:30:00',
    escalated_at: '2026-08-23T14:51:00',
    privacy_class: 'sirkete_ozel'
  },
  {
    id: 'q19',
    text: 'Kısmi süreli çalışanda hafta tatili ücreti nasıl hesaplanır?',
    asker_id: 'u8',
    company_id: null,
    tag_id: ['t21', 't27'],
    // Dasi'nin KB eşleşmesiyle çözdüğü örnek: uzman havuzuna hiç uğramadı
    // (Kuzey Yıldızı metriği bu tür kayıtlardan hesaplanır).
    status: 'otomatik_cevaplandi',
    created_at: '2026-08-24T08:20:00',
    privacy_class: 'genel'
  },
  {
    id: 'q20',
    text: 'Işıldak Lojistik A.Ş. için ayrı işyeri dosyası açıldığında eski dosyadaki teşvikler devam eder mi?',
    asker_id: 'u2',
    company_id: 's4',
    tag_id: ['t1', 't12'],
    status: 'eskale_edildi',
    created_at: '2026-08-22T17:10:00',
    escalated_at: '2026-08-22T17:33:00',
    privacy_class: 'sirkete_ozel'
  },

  // ── Uzman cevabıyla çözülmüş sorular ──
  {
    id: 'q21',
    text: 'Doğum izni sonrası süt izni saatleri puantaja nasıl işlenir?',
    asker_id: 'u2',
    company_id: null,
    tag_id: ['t13', 't9'],
    status: 'cozuldu',
    created_at: '2026-08-19T10:05:00',
    privacy_class: 'genel'
  },
  {
    id: 'q22',
    text: "Ergene Tekstil'de kullanılmayan yıllık izin kaç güne kadar devredilebilir?",
    asker_id: 'u1',
    company_id: 's1',
    tag_id: ['t8'],
    status: 'cozuldu',
    created_at: '2026-08-17T11:40:00',
    privacy_class: 'sirkete_ozel'
  },
  {
    id: 'q23',
    text: 'İhbar tazminatı brüt ücret üzerinden mi hesaplanır?',
    asker_id: 'u6',
    company_id: null,
    tag_id: ['t11', 't10'],
    status: 'cozuldu',
    created_at: '2026-08-16T09:30:00',
    privacy_class: 'genel'
  },
  {
    id: 'q24',
    text: "Işıldak Lojistik'te fazla mesai ücreti yerine serbest zaman kullandırılabilir mi?",
    asker_id: 'u6',
    company_id: 's2',
    tag_id: ['t3'],
    status: 'cozuldu',
    created_at: '2026-08-15T13:15:00',
    privacy_class: 'sirkete_ozel'
  },
  {
    id: 'q25',
    text: 'Asgari ücret desteği hangi işyerlerine ve hangi koşullarla uygulanıyor?',
    asker_id: 'u8',
    company_id: null,
    tag_id: ['t12'],
    status: 'cozuldu',
    created_at: '2026-08-14T10:50:00',
    privacy_class: 'genel'
  },
  {
    id: 'q26',
    text: "Kaya Otomotiv'de vardiya primi SGK'ya bildirilirken hangi kaleme yazılıyor?",
    asker_id: 'u6',
    company_id: 's3',
    tag_id: ['t7', 't14'],
    status: 'cozuldu',
    created_at: '2026-08-13T14:05:00',
    privacy_class: 'sirkete_ozel'
  },
  {
    id: 'q27',
    text: "İşe iade davası kazanıldığında boşta geçen süre ücreti SGK'ya nasıl bildirilir?",
    asker_id: 'u1',
    company_id: null,
    tag_id: ['t4', 't1'],
    status: 'cozuldu',
    created_at: '2026-08-12T15:25:00',
    privacy_class: 'genel'
  },
  {
    id: 'q28',
    text: "Demir İnşaat'ta ay içinde işe giren çalışanın eksik gün kodu ne olmalı?",
    asker_id: 'u2',
    company_id: 's5',
    tag_id: ['t1', 't26'],
    status: 'cozuldu',
    created_at: '2026-08-10T09:45:00',
    privacy_class: 'sirkete_ozel'
  },
  {
    id: 'q29',
    text: 'BES otomatik katılımda cayma süresi kaç gündür?',
    asker_id: 'u2',
    company_id: null,
    tag_id: ['t6'],
    status: 'cozuldu',
    created_at: '2026-08-09T11:20:00',
    privacy_class: 'genel'
  },
  {
    id: 'q30',
    text: "Ergene Tekstil'de kısmi süreli çalışanın SGK gün sayısı nasıl bildiriliyor?",
    asker_id: 'u8',
    company_id: 's1',
    tag_id: ['t21', 't1'],
    status: 'cozuldu',
    created_at: '2026-08-08T16:00:00',
    privacy_class: 'sirkete_ozel'
  },
  {
    id: 'q31',
    text: 'Gelir vergisi istisnası asgari ücret üzerinden nasıl uygulanıyor?',
    asker_id: 'u6',
    company_id: null,
    tag_id: ['t22', 't12'],
    status: 'cozuldu',
    created_at: '2026-08-07T10:10:00',
    privacy_class: 'genel'
  },
  {
    id: 'q32',
    text: "Işıldak Lojistik'te istirahatli çalışanın eksik gün bildirimi hangi kodla yapılıyor?",
    asker_id: 'u1',
    company_id: 's2',
    tag_id: ['t23', 't1'],
    status: 'cozuldu',
    created_at: '2026-08-06T14:35:00',
    privacy_class: 'sirkete_ozel'
  },
  {
    id: 'q33',
    text: 'Fazla çalışma onayı her yıl yeniden alınmak zorunda mı?',
    asker_id: 'u5',
    company_id: null,
    tag_id: ['t3', 't16'],
    status: 'cozuldu',
    created_at: '2026-08-05T09:55:00',
    privacy_class: 'genel'
  }
];

export const seedAnswers: Answer[] = [
  {
    id: 'c1',
    question_id: 'q2',
    kind: 'otomatik',
    text:
      'kb2 numaralı KB kaydına göre: normal günlük ücrete ek bir günlük ücret daha ödenir (toplam 2 günlük ücret).',
    answered_by: null,
    references: ['kb2'],
    attachments: [],
    verified: true,
    verified_by: null,
    created_at: '2026-08-15'
  },
  // GENİŞLETME (V8): FR-14b uzman bazlı istatistik hesaplanabilsin diye
  // tip:"uzman" cevaplar, ISO datetime ve cevaplayan_id ile.
  {
    id: 'c2',
    question_id: 'q3',
    kind: 'otomatik',
    text: 'Bu konuda kayıtlı bilgi bulunamadı.',
    answered_by: null,
    references: [],
    attachments: [],
    not_found: true, // V41: bayrak eksikti, deneme cevap gibi görünüyordu
    verified: false,
    verified_by: null,
    created_at: '2026-08-12T10:15:30'
  },
  {
    id: 'c3',
    question_id: 'q3',
    kind: 'uzman',
    text:
      'Kıdem tazminatı giydirilmiş brüt ücret üzerinden hesaplanır. Süreklilik arz eden yol ve yemek yardımı hesaba dahil edilir; arızi ödemeler dahil edilmez. Hesaplanan tutar dönemin kıdem tazminatı tavanını aşamaz.',
    answered_by: 'u3',
    references: ['kb9'],
    attachments: [],
    verified: true,
    verified_by: 'u3',
    created_at: '2026-08-12T12:05:00'
  },
  {
    id: 'c4',
    question_id: 'q5',
    kind: 'uzman',
    text:
      'Tavanı aşan kısımdan SGK primi kesilmemesi, ancak gelir vergisi matrahına dahil edilmesi gerekir. Bordroda brüt ücretin tavan üstü kısmı ayrıştırılarak düzeltme yapılmalı, ilgili ay için ek bildirge değerlendirilmelidir.',
    answered_by: 'u4',
    references: ['kb7'],
    attachments: ['tavan-kontrol-listesi.xlsx'],
    verified: true,
    verified_by: 'u4',
    created_at: '2026-08-13T11:50:00'
  },
  {
    id: 'c5',
    question_id: 'q6',
    kind: 'otomatik',
    text: "Bu konuda kayıtlı bilgi bulunamadı. 'çalışma izni' konusunda doğrulanmış bir KB kaydı yok.",
    answered_by: null,
    references: [],
    attachments: [],
    not_found: true, // V41
    verified: false,
    verified_by: null,
    created_at: '2026-08-20T11:05:20'
  },
  {
    id: 'c6',
    question_id: 'q8',
    kind: 'uzman',
    text:
      'İhbar öneli içinde yıllık izin kullandırılamaz; ihbar öneli ile yıllık izin süreleri iç içe geçemez. İzin ihbar önelinin dışında kullandırılmalı ya da ücrete dönüştürülmelidir.',
    answered_by: 'u3',
    references: ['kb10', 'kb8'],
    attachments: [],
    verified: true,
    verified_by: 'u3',
    created_at: '2026-08-11T14:30:00'
  },
  {
    id: 'c7',
    question_id: 'q10',
    kind: 'otomatik',
    text:
      'kb5 numaralı KB kaydına göre: saklama süresi ve erişim yetkisi net tanımlanmalıdır; süre, işleme amacıyla orantılı ve gerekli olandan uzun olmamalıdır.',
    answered_by: null,
    references: ['kb5'],
    attachments: [],
    verified: false,
    verified_by: null,
    created_at: '2026-08-14T15:10:25'
  },
  {
    id: 'c8',
    question_id: 'q10',
    kind: 'derin_arastirma',
    text:
      'KVKK kaynaklarına göre kamera kayıtları için genel kabul gören uygulama, işleme amacının ortadan kalkmasıyla birlikte kaydın silinmesidir. Sektörel uygulamada 1-2 aylık saklama sürelerinin orantılı kabul edildiği görülmektedir; süre şirket bazlı saklama politikasında yazılı olmalıdır.',
    answered_by: null,
    references: ['mkay7', 'mkay2'],
    attachments: [],
    verified: true,
    verified_by: 'u4', // Bilgi Uzmanı AI cevabını verified'a yükseltti (FR-7)
    created_at: '2026-08-14T15:12:00'
  },
  // GENİŞLETME (V33): Eskale edilmiş sorularda otomatik deneme kaydı yoktu;
  // PRD §4.3'e göre havuza düşmenin sebebi tam olarak bu denemenin yetersiz
  // kalmasıdır. Havuz konsolu "neden havuzda?" zaman çizelgesini bu kayıttan
  // üretir — uydurmadan, veriden.
  {
    id: 'c9',
    question_id: 'q1',
    kind: 'otomatik',
    text:
      "Bu konuda kayıtlı bilgi bulunamadı. 'sgk-bildirimi' etiketli kayıtlar tarandı; doğum izni sonrası eksik gün kodu için doğrulanmış bir kayıt yok.",
    answered_by: null,
    references: [],
    attachments: [],
    not_found: true,
    verified: false,
    verified_by: null,
    created_at: '2026-08-18T09:12:00'
  },
  {
    id: 'c10',
    question_id: 'q4',
    kind: 'otomatik',
    text:
      "Bu konuda kayıtlı bilgi bulunamadı. 'fazla-mesai' ve 'puantaj' etiketli kayıtlar yıllık üst sınırı açıklıyor; vardiyalı çalışmada takip yöntemine ilişkin doğrulanmış kayıt yok.",
    answered_by: null,
    references: [],
    attachments: [],
    not_found: true,
    verified: false,
    verified_by: null,
    created_at: '2026-08-19T14:51:00'
  },
  {
    id: 'c11',
    question_id: 'q9',
    kind: 'otomatik',
    text:
      "Bu konuda kayıtlı bilgi bulunamadı. 'asgari-ucret' etiketli kayıtlar destek tutarını içeriyor; yürürlük ayları şirket bazlı olduğu için otomatik cevap üretilemedi.",
    answered_by: null,
    references: [],
    attachments: [],
    not_found: true,
    verified: false,
    verified_by: null,
    created_at: '2026-08-21T09:58:00'
  },
  {
    id: 'c12',
    question_id: 'q11',
    kind: 'otomatik',
    text:
      "Bu konuda kayıtlı bilgi bulunamadı. 'kismi-zamanli-calisma' ve 'yillik-izin' etiketli kayıtlar tam süreli çalışmayı esas alıyor.",
    answered_by: null,
    references: [],
    attachments: [],
    not_found: true,
    verified: false,
    verified_by: null,
    created_at: '2026-08-22T16:39:00'
  },
  {
    id: 'c13',
    question_id: 'q12',
    kind: 'otomatik',
    text:
      "Bu konuda kayıtlı bilgi bulunamadı. 'istirahat-raporu' etiketli kayıtlar rapor süresince bildirimi açıklıyor; işe dönüş günü bildirimi için doğrulanmış kayıt yok.",
    answered_by: null,
    references: [],
    attachments: [],
    not_found: true,
    verified: false,
    verified_by: null,
    created_at: '2026-08-23T17:32:00'
  },
  // ═══ GENİŞLETME (V41) — yeni soruların cevap kayıtları.
  // Kural: eskale edilmiş sorularda YALNIZCA bulunamadi:true otomatik deneme
  // vardır (uzman cevabı yok). Çözülmüş sorularda tip:"uzman", cevaplayan_id
  // dolu ve verified:true — cevaplayanlar yalnızca Bilgi Uzmanı Havuzu (u3/u4).

  // ── Havuza düşme gerekçeleri (cevap değil, sonuçsuz tarama) ──
  {
    id: 'c14',
    question_id: 'q13',
    kind: 'otomatik',
    text:
      "Bu konuda kayıtlı bilgi bulunamadı. 'bayram-yardimi' etiketli kayıtlar bordroda gösterimi genel olarak açıklıyor; mavi yaka ikramiyesinin şirket bazlı kalem karşılığı için doğrulanmış kayıt yok.",
    answered_by: null,
    references: [],
    attachments: [],
    not_found: true,
    verified: false,
    verified_by: null,
    created_at: '2026-08-22T10:32:00'
  },
  {
    id: 'c15',
    question_id: 'q14',
    kind: 'otomatik',
    text:
      "Bu konuda kayıtlı bilgi bulunamadı. 'isten-cikis-kodu' etiketli kayıt kod değişikliği sürecini açıklıyor; iki kodun işsizlik ödeneğine etkisi karşılaştırmalı olarak kayıtlı değil.",
    answered_by: null,
    references: [],
    attachments: [],
    not_found: true,
    verified: false,
    verified_by: null,
    created_at: '2026-08-23T11:17:00'
  },
  {
    id: 'c16',
    question_id: 'q15',
    kind: 'otomatik',
    text:
      "Bu konuda kayıtlı bilgi bulunamadı. 'genc-isci' etiketli kayıt çalıştırma koşullarını içeriyor; vardiya düzeni için doğrulanmış kayıt yok.",
    answered_by: null,
    references: [],
    attachments: [],
    not_found: true,
    verified: false,
    verified_by: null,
    created_at: '2026-08-20T09:27:00'
  },
  {
    id: 'c17',
    question_id: 'q16',
    kind: 'otomatik',
    text:
      "Bu konuda kayıtlı bilgi bulunamadı. 'hafta-tatili' etiketli kayıtlar genel hesabı açıklıyor; yolda geçen sürenin çalışma süresine sayılması şirket bazlı olduğu için otomatik cevap üretilemedi.",
    answered_by: null,
    references: [],
    attachments: [],
    not_found: true,
    verified: false,
    verified_by: null,
    created_at: '2026-08-21T15:52:00'
  },

  // ── Uzman cevapları ──
  {
    id: 'c18',
    question_id: 'q21',
    kind: 'uzman',
    text:
      'Süt izni çalışma süresi sayılır ve ücretli izin olarak puantaja işlenir; devamsızlık ya da eksik gün olarak gösterilmez. Günlük 1,5 saatlik süre, taraflar anlaşırsa toplu olarak da kullandırılabilir — bu durumda kullandırılan gün/saat puantaj notunda belirtilmelidir.',
    answered_by: 'u4',
    references: ['kb12', 'kb21'],
    attachments: [],
    verified: true,
    verified_by: 'u4',
    created_at: '2026-08-19T12:40:00'
  },
  {
    id: 'c19',
    question_id: 'q22',
    kind: 'uzman',
    text:
      "Yıllık izin devri sınırsız değildir: izin, hak kazanıldığı yılı takip eden bir yıl içinde kullandırılmalıdır. Devredilen izinlerin yıl bazında ayrı takip edilmesi ve izin defterine işlenmesi gerekir. Ergene Tekstil'de devir bakiyesi bordro dönemiyle birlikte kontrol ediliyor.",
    answered_by: 'u3',
    references: ['kb8'],
    attachments: ['izin-devir-takip.xlsx'],
    verified: true,
    verified_by: 'u3',
    created_at: '2026-08-17T14:20:00'
  },
  {
    id: 'c20',
    question_id: 'q23',
    kind: 'uzman',
    text:
      'İhbar tazminatı giydirilmiş brüt ücret üzerinden hesaplanır; hesaplanan tutardan yalnızca gelir vergisi ve damga vergisi kesilir, SGK primi kesilmez. Kıdem tazminatından farkı budur.',
    answered_by: 'u3',
    references: ['kb10'],
    attachments: [],
    verified: true,
    verified_by: 'u3',
    created_at: '2026-08-16T11:05:00'
  },
  {
    id: 'c21',
    question_id: 'q24',
    kind: 'otomatik',
    text:
      "Bu konuda kayıtlı bilgi bulunamadı. 'fazla-mesai' etiketli kayıtlar oran hesabını açıklıyor; serbest zaman kullandırımı için doğrulanmış kayıt yok.",
    answered_by: null,
    references: [],
    attachments: [],
    not_found: true,
    verified: false,
    verified_by: null,
    created_at: '2026-08-15T13:22:00'
  },
  {
    id: 'c22',
    question_id: 'q24',
    kind: 'uzman',
    text:
      "Çalışan talep ederse fazla çalıştığı her saat karşılığında bir saat otuz dakika serbest zaman kullanabilir. Serbest zaman, çalışanın talebinden itibaren altı ay içinde iş günlerinde ve kesintisiz olarak kullandırılır. Işıldak Lojistik'te bu tercih puantaj notunda ayrıca işaretleniyor.",
    answered_by: 'u4',
    references: ['kb31'],
    attachments: [],
    verified: true,
    verified_by: 'u4',
    created_at: '2026-08-15T16:10:00'
  },
  {
    id: 'c23',
    question_id: 'q25',
    kind: 'uzman',
    text:
      'Asgari ücret desteği, ilgili yıl için belirlenen tutar üzerinden ve aylık prim/hizmet belgesini yasal süresinde veren işyerlerine uygulanır. Destekten yararlanmak için prim borcu bulunmaması ve kayıt dışı çalışan tespiti olmaması gerekir. Tutar ve yürürlük ayları her yıl kararla belirlenir.',
    answered_by: 'u4',
    references: ['kb13'],
    attachments: [],
    verified: true,
    verified_by: 'u4',
    created_at: '2026-08-14T13:30:00'
  },
  {
    id: 'c24',
    question_id: 'q26',
    kind: 'otomatik',
    text:
      "Bu konuda kayıtlı bilgi bulunamadı. 'sgk-tavan' etiketli kayıt tavan aşımını açıklıyor; vardiya priminin bildirim kalemi şirket bazlı.",
    answered_by: null,
    references: [],
    attachments: [],
    not_found: true,
    verified: false,
    verified_by: null,
    created_at: '2026-08-13T14:12:00'
  },
  {
    id: 'c25',
    question_id: 'q26',
    kind: 'uzman',
    text:
      'Vardiya primi ücretin eki niteliğinde olduğu için prime esas kazanca dahil edilir ve brüt ücretle birlikte bildirilir; ayrı bir istisna kalemi değildir. Tavanı aşan kısımdan prim kesilmez, ancak gelir vergisi matrahına dahil edilir.',
    answered_by: 'u3',
    references: ['kb7'],
    attachments: [],
    verified: true,
    verified_by: 'u3',
    created_at: '2026-08-13T16:45:00'
  },
  {
    id: 'c26',
    question_id: 'q27',
    kind: 'uzman',
    text:
      "İşe başlatılmayan çalışan için boşta geçen en çok dört aylık ücret, ilgili aylara mal edilerek SGK'ya bildirilir; bildirim, kararın kesinleşmesini takip eden ayın sonuna kadar yapılmalıdır. Bu süre hizmet süresine de eklenir.",
    answered_by: 'u3',
    references: ['kb19'],
    attachments: [],
    verified: true,
    verified_by: 'u3',
    created_at: '2026-08-12T17:05:00'
  },
  {
    id: 'c27',
    question_id: 'q28',
    kind: 'uzman',
    text:
      'Ay içinde işe giren çalışanda eksik gün gerekçesi "işe giriş" olarak bildirilir; ayrı bir istirahat veya izin kodu kullanılmaz. Eksik gün sayısı, işe giriş tarihinden ayın sonuna kadar geçen gün sayısına göre hesaplanır.',
    answered_by: 'u4',
    references: ['kb12', 'kb26'],
    attachments: [],
    verified: true,
    verified_by: 'u4',
    created_at: '2026-08-10T11:35:00'
  },
  {
    id: 'c28',
    question_id: 'q29',
    kind: 'uzman',
    text:
      'Otomatik katılımda çalışan, sisteme dahil edildiğinin kendisine bildirildiği tarihten itibaren iki ay içinde cayma hakkını kullanabilir. Cayma hâlinde ödenen katkı payları varsa getirisiyle birlikte iade edilir.',
    answered_by: 'u4',
    references: ['kb6'],
    attachments: [],
    verified: true,
    verified_by: 'u4',
    created_at: '2026-08-09T13:15:00'
  },
  {
    id: 'c29',
    question_id: 'q30',
    kind: 'otomatik',
    text:
      "Bu konuda kayıtlı bilgi bulunamadı. 'kismi-zamanli-calisma' etiketli kayıt tam zamanlıya geçişi açıklıyor; gün sayısı bildirimi için doğrulanmış kayıt yok.",
    answered_by: null,
    references: [],
    attachments: [],
    not_found: true,
    verified: false,
    verified_by: null,
    created_at: '2026-08-08T16:09:00'
  },
  {
    id: 'c30',
    question_id: 'q30',
    kind: 'uzman',
    text:
      'Kısmi süreli çalışanda SGK gün sayısı, ay içinde fiilen çalışılan saatlerin günlük 7,5 saate bölünmesiyle bulunur; küsurat tama tamamlanır. Kalan günler için eksik gün gerekçesi "kısmi süreli çalışma" olarak bildirilir.',
    answered_by: 'u3',
    references: ['kb20'],
    attachments: [],
    verified: true,
    verified_by: 'u3',
    created_at: '2026-08-08T18:20:00'
  },
  {
    id: 'c31',
    question_id: 'q31',
    kind: 'uzman',
    text:
      'Gelir vergisi istisnası, asgari ücretin vergi matrahına isabet eden kısmı üzerinden hesaplanır ve tüm çalışanlara uygulanır. İstisna tutarı bordroda ayrı satırda gösterilmeli; kümülatif matrah hesabında istisna sonrası tutar dikkate alınmalıdır.',
    answered_by: 'u3',
    references: ['kb27', 'kb13'],
    attachments: [],
    verified: true,
    verified_by: 'u3',
    created_at: '2026-08-07T12:25:00'
  },
  {
    id: 'c32',
    question_id: 'q32',
    kind: 'otomatik',
    text:
      "Bu konuda kayıtlı bilgi bulunamadı. 'istirahat-raporu' etiketli kayıt çalışmadı bildirimini açıklıyor; eksik gün kodu eşleşmesi doğrulanmış kayıtta yok.",
    answered_by: null,
    references: [],
    attachments: [],
    not_found: true,
    verified: false,
    verified_by: null,
    created_at: '2026-08-06T14:42:00'
  },
  {
    id: 'c33',
    question_id: 'q32',
    kind: 'uzman',
    text:
      'İstirahatli günler için eksik gün gerekçesi "istirahat" olarak bildirilir ve ayrıca çalışmadı bildirimi yapılır. Çalışmadı bildiriminin eksikliği idari para cezasına yol açar; rapor bitiş tarihini takip eden ilk iş günü kontrol edilmelidir.',
    answered_by: 'u4',
    references: ['kb28'],
    attachments: [],
    verified: true,
    verified_by: 'u4',
    created_at: '2026-08-06T17:00:00'
  },
  {
    id: 'c35',
    question_id: 'q19',
    kind: 'otomatik',
    text:
      'kb24 numaralı KB kaydına göre: kısmi süreli çalışanda hafta tatili ücreti, çalışılan süreyle orantılı olarak hesaplanır; tam süreli çalışan gibi tam gün ücreti ödenmez.',
    answered_by: null,
    references: ['kb24', 'kb20'],
    attachments: [],
    verified: false,
    verified_by: null,
    created_at: '2026-08-24T08:20:25'
  },
  {
    id: 'c34',
    question_id: 'q33',
    kind: 'uzman',
    text:
      'Fazla çalışma için işçinin yazılı onayı gerekir. Onayın her yıl başında yenilenmesi zorunlu değildir; sözleşmede süresiz verilmiş bir onay geçerlidir. Ancak uygulamada onayın yıllık yenilenmesi ispat kolaylığı sağladığı için tavsiye edilir.',
    answered_by: 'u3',
    references: ['kb31'],
    attachments: [],
    verified: true,
    verified_by: 'u3',
    created_at: '2026-08-05T11:40:00'
  }
];

// ---------- GERİBİLDİRİMLER (onay/red işaretleri) ----------
// GENİŞLETME (V6): Şema 03 §2. Orijinal dosyada bu dizi yoktu.
export const seedFeedback: Feedback[] = [
  { id: 'g1', target_kind: 'cevap', target_id: 'c3', user_id: 'u1', value: 'onay', date: '2026-08-12T13:00:00' },
  { id: 'g2', target_kind: 'cevap', target_id: 'c8', user_id: 'u6', value: 'onay', date: '2026-08-14T15:20:00' },
  { id: 'g3', target_kind: 'cevap', target_id: 'c7', user_id: 'u6', value: 'red', date: '2026-08-14T15:11:00' },
  { id: 'g4', target_kind: 'kb_kaydi', target_id: 'kb3', user_id: 'u2', value: 'onay', date: '2026-08-05T10:00:00' }
];

// ---------- FLAG / RAPOR KAYITLARI ----------
// GENİŞLETME (V6): Şema 03 §2. Raporlanan İçerikler ekranı ilk açılışta dolu gelsin.
export const seedFlags: Flag[] = [
  {
    id: 'f1',
    target_kind: 'kb_kaydi',
    target_id: 'kb7',
    reporter_id: 'u2',
    reason: 'SGK tavan tutarı 2026 için güncellenmiş olabilir; kayıt hangi döneme ait olduğunu belirtmiyor.',
    status: 'acik',
    updated_by: null,
    date: '2026-08-20T09:30:00'
  },
  {
    id: 'f2',
    target_kind: 'cevap',
    target_id: 'c1',
    reporter_id: 'u1',
    reason: 'Cevap yan hakların dahil edilmediğini yazmıyor, eksik kalıyor.',
    status: 'inceleniyor',
    updated_by: 'u3',
    date: '2026-08-19T11:00:00'
  },
  // V40: "guncellendi" artık ayrı bir durum değil, kapanışın sonucu.
  {
    id: 'f3',
    target_kind: 'kb_kaydi',
    target_id: 'kb6',
    reporter_id: 'u6',
    reason: 'Yaş aralığının tam olarak kaç olduğu yazılmamış.',
    status: 'kapandi',
    outcome: 'guncellendi',
    description: 'Otomatik BES yaş aralığı (18–45) kayda eklendi, dönem bilgisi netleştirildi.',
    updated_by: 'u4',
    date: '2026-08-08T14:00:00',
    updated_at: '2026-08-09T10:20:00'
  },
  // V40: Kapandı sekmesinde iki sonucun yan yana görünmesi için ikinci örnek.
  {
    id: 'f5',
    target_kind: 'cevap',
    target_id: 'c3',
    reporter_id: 'u1',
    reason: 'Kıdem tazminatı tavanının bu cevapta eski tutarla anlatıldığını düşünüyorum.',
    status: 'kapandi',
    outcome: 'degisiklik_gerekmedi',
    description:
      'Cevapta verilen tavan tutarı, sorunun ilgili olduğu dönem için doğru. Yürürlükteki tutar cevabın sonunda ayrıca belirtiliyor, güncelleme gerekmedi.',
    expert_reply:
      'Cevapta verilen tavan tutarı, sorunun ilgili olduğu dönem için doğru. Yürürlükteki tutar cevabın sonunda ayrıca belirtiliyor, güncelleme gerekmedi.',
    replied_by: 'u3',
    reply_source: { url: 'https://www.sgk.gov.tr', title: 'SGK — Prime esas kazanç tutarları' },
    reporter_ack: 'anladi',
    updated_by: 'u3',
    date: '2026-08-11T09:15:00',
    updated_at: '2026-08-12T16:40:00'
  },
  {
    id: 'f4',
    target_kind: 'kb_kaydi',
    target_id: 'kb9',
    reporter_id: 'u1',
    reason:
      'Yemek kartı ödemesinin kıdem tazminatı hesabına her durumda dahil edildiğini düşünüyorum; kayıtta süreklilik şartı yazdığı için bilgi eksik veya hatalı olabilir.',
    status: 'acik',
    updated_by: null,
    date: '2026-08-23T15:40:00'
  }
];

// ---------- KNOW-HOW NOTLARI (şirket özel, tribal knowledge örneği) ----------
export const seedNotes: Note[] = [
  {
    id: 'kh1',
    company_id: 's2',
    text:
      "Işıldak Lojistik puantajını her ayın 25'inde gönderir. Gecikme olursa muhasebe sorumlusu Merve Hanım aranmalı.",
    author_id: 'u2',
    status: 'yayinda'
  },
  {
    id: 'kh2',
    company_id: 's1',
    text:
      "Ergene Tekstil'de mavi yaka personel için ihbar öneli, standart sürelerden farklı olarak firma dosyasında ayrıca kayıtlıdır.",
    author_id: 'u1',
    status: 'yayinda'
  },
  // GENİŞLETME (V9): Know-how Notları ekranının (Ç2) çapraz listesi için
  {
    id: 'kh3',
    company_id: 's3',
    text:
      "Kaya Otomotiv vardiya planını ayın 20'sinde kilitler; sonrasında gelen değişiklikler bir sonraki döneme yazılır.",
    author_id: 'u1',
    status: 'yayinda'
  },
  {
    id: 'kh4',
    company_id: 's2',
    text:
      "Işıldak Lojistik'in İzmir şubesi için ayrı SGK işyeri dosyası var — bildirimler şube bazında ayrı yapılmalı.",
    author_id: 'u2',
    status: 'yayinda'
  },
  {
    id: 'kh5',
    company_id: 's5',
    text:
      'Demir İnşaat taşeron çalışanlarını ayrı listede iletiyor; bordro öncesi iki listenin birleştirildiği teyit edilmeli.',
    author_id: 'u6',
    status: 'oneri'
  }
];

// ---------- HAFTALIK BÜLTEN (mock — gerçek scraper yerine sabit örnek) ----------
export const seedBulletins: BulletinEntry[] = [
  // V29: Bülten GÜNLÜK değil HAFTALIK — her Pazartesi bir sayı yayımlanır
  // (config.js UYGULAMA.bultenGonderimGunu). Bu yüzden tüm `date` alanları
  // Pazartesi gününe denk gelir; ekran kayıtları haftalık sayı olarak gruplar.
  // Doğrulanabilir: 2026-07-27, 08-03, 08-10, 08-17 → hepsi Pazartesi.

  // ── 17 Ağustos 2026 · bu haftanın sayısı ──
  {
    id: 'b1',
    date: '2026-08-17',
    summary: "2026 yılı asgari ücret tespit kararı Resmî Gazete'de yayımlandı; brüt/net tutarlar ve işveren maliyeti güncellendi.",
    cover_image_url: '/assets/bulletin/asgari-ucret.jpg',
    related_legislation_content_id: ['mk9'],
    send_time: '09:00'
  },
  {
    id: 'b2',
    date: '2026-08-17',
    summary: 'Çalışan kişisel verilerinde aydınlatma yükümlülüğüne dair KVKK açıklaması yayımlandı.',
    cover_image_url: '/assets/bulletin/kvkk-genel.jpg',
    related_legislation_content_id: ['mk10'],
    send_time: '09:00'
  },
  {
    id: 'b3',
    date: '2026-08-17',
    summary: 'SGK prime esas kazanç tavanının dönemsel takibine dair kurum duyurusu güncellendi.',
    cover_image_url: '/assets/bulletin/sgk-tavan.jpg',
    related_legislation_content_id: ['mk7'],
    send_time: '09:00'
  },

  // ── 10 Ağustos 2026 ──
  {
    id: 'b4',
    date: '2026-08-10',
    summary: 'Otomatik BES kapsamındaki yaş aralığına ilişkin uygulama notu yenilendi.',
    cover_image_url: '/assets/bulletin/bes-otomatik.jpg',
    related_legislation_content_id: ['mk6'],
    send_time: '09:00'
  },
  {
    id: 'b5',
    date: '2026-08-10',
    summary: 'Yıllık ücretli izin kayıtlarının tutulmasına dair rehber içerik güncellendi.',
    cover_image_url: '/assets/bulletin/yillik-izin.jpg',
    related_legislation_content_id: ['mk8'],
    send_time: '09:00'
  },
  {
    id: 'b6',
    date: '2026-08-10',
    summary: 'İşyerinde dijital çalışan takibinde ölçülülük ve veri minimizasyonu ilkeleri hatırlatıldı.',
    cover_image_url: '/assets/bulletin/guvenlik-kamerasi.jpg',
    related_legislation_content_id: ['mk31'],
    send_time: '09:00'
  },

  // ── 3 Ağustos 2026 ──
  {
    id: 'b7',
    date: '2026-08-03',
    summary: 'Geçici iş göremezlikte çalışmadı bildirimi yükümlülüğü ve idari para cezası riski özetlendi.',
    cover_image_url: '/assets/bulletin/sgk-tavan.jpg',
    related_legislation_content_id: ['mk26'],
    send_time: '09:00'
  },
  {
    id: 'b8',
    date: '2026-08-03',
    summary: 'İşe iade arabuluculuğunda asıl/alt işverenin birlikte katılım şartı Anayasa Mahkemesi kararıyla iptal edildi.',
    cover_image_url: '/assets/bulletin/ise-iade.jpg',
    related_legislation_content_id: ['mk17'],
    send_time: '09:00'
  },

  // ── 27 Temmuz 2026 ──
  {
    id: 'b9',
    date: '2026-07-27',
    summary: 'Fazla mesainin ücret niteliği ve işveren açısından bordro riski üzerine yeni bir değerlendirme yayınlandı.',
    cover_image_url: '/assets/bulletin/fazla-mesai.jpg',
    related_legislation_content_id: ['mk3'],
    send_time: '09:00'
  },
  {
    id: 'b10',
    date: '2026-07-27',
    summary: 'Arabuluculuk tutanağı sonrası işe iade davası açılabilirliği netleşti.',
    cover_image_url: '/assets/bulletin/ise-iade.jpg',
    related_legislation_content_id: ['mk4'],
    send_time: '09:00'
  },
  {
    id: 'b11',
    date: '2026-07-27',
    summary: 'İşyerlerinde güvenlik kamerası kullanımına dair KVKK uyarıları güncellendi.',
    cover_image_url: '/assets/bulletin/guvenlik-kamerasi.jpg',
    related_legislation_content_id: ['mk5'],
    send_time: '09:00'
  }
];

// ---------- DERİN ARAŞTIRMA — ETİKET → KAYNAK HARİTASI ----------
// GENİŞLETME (V14): 11-prototip-notu §2 "Derin Araştırma: Mock — sabit bir
// kaynak listesinden bulunmuş gibi cevap simülasyonu". RACI'de "Derin Araştırma
// kaynak haritası (etiket → kaynak eşlemesi)" ayrı bir aktivite olarak tanımlı.
export const seedDeepResearchMap: Record<string, string[]> = {
  t1: ['mkay3', 'mkay2', 'mkay1'],
  t2: ['mkay2', 'mkay1', 'mkay8'],
  t3: ['mkay2', 'mkay6', 'mkay8'],
  t4: ['mkay6', 'mkay2'],
  t5: ['mkay7', 'mkay2'],
  t6: ['mkay3', 'mkay1'],
  t7: ['mkay3', 'mkay4'],
  t8: ['mkay2', 'mkay5'],
  t10: ['mkay2', 'mkay6'],
  t11: ['mkay2', 'mkay6'],
  t12: ['mkay1', 'mkay5', 'mkay3'],
  t13: ['mkay3', 'mkay5'],
  _varsayilan: ['mkay1', 'mkay2', 'mkay5']
};

// ---------- TAGGING SÖZLÜĞÜ ----------
// 03-veri-modeli-ve-mimari.md §4: "Başlangıç yaklaşımı: anahtar kelime sözlüğü
// tabanlı eşleştirme". Hedef mimaride embedding ile değiştirilebilir olmalı —
// bu yüzden sözlük veri olarak burada, motor api-client.js'te soyutlanmıştır.
// ---------- EŞLEŞTİRMEDE SAYILMAYAN SÖZCÜKLER ----------
// Soru kalıbı ve alan-geneli sözcükler. Bunlar KB kayıtlarının neredeyse
// tamamında geçtiği için "konu aynı mı" sorusuna hiçbir kanıt sunmuyor;
// sayıldıklarında alakasız kayıtlar eşleşmiş gibi görünüyordu (bkz. NOTLAR.md V26).
// Alan terimleri (ücret, izin, vergi, matrah, prim, tavan, bordro, mesai...)
// bilinçli olarak BURADA DEĞİL — onlar ayırt edici sinyaldir.
export const seedStopWords: string[] = [
  // soru kalıbı
  'nasıl',
  'nedir',
  'nelere',
  'neler',
  'hangi',
  'kimler',
  'neden',
  'niçin',
  'midir',
  'mıdır',
  'mudur',
  'müdür',
  'mümkün',
  'gerekir',
  'gerekli',
  'gereken',
  'edilir',
  'edilmeli',
  'edilmesi',
  'yapılır',
  'yapılmalı',
  'yapılması',
  'olmalı',
  'olması',
  'hesaplanır',
  'hesaplanması',
  'gösterilir',
  'gösterilmesi',
  'uygulanır',
  'uygulanması',
  'dikkat',
  'durumda',
  'durumunda',
  'konusunda',
  'hakkında',
  'açısından',
  'sonrası',
  'sonra',
  'önce',
  'için',
  'ancak',
  'ayrıca',
  'veya',
  'yoksa',
  'varsa',
  'olan',
  'olur',
  // alan geneli (her kayıtta geçer)
  'çalışan',
  'çalışanın',
  'çalışanlar',
  'çalışanların',
  'çalışma',
  'personel',
  'personelin',
  'personele',
  'işçi',
  'işçinin',
  'işveren',
  'şirket',
  'şirketin',
  'şirkette',
  'firma',
  'firmanın'
];

export const seedTagDictionary: Record<string, string[]> = {
  t1: ['sgk', 'bildirim', 'bildirge', 'eksik gün', 'prim hizmet', 'işten ayrılış'],
  t2: ['resmi tatil', 'ulusal bayram', '29 ekim', 'genel tatil', 'bayram ücreti', 'tatil ücreti'],
  t3: ['fazla mesai', 'fazla çalışma', 'mesai', 'overtime', 'vardiya'],
  t4: ['işe iade', 'arabuluculuk', 'dava', 'tutanak'],
  t5: ['kvkk', 'kişisel veri', 'kamera', 'aydınlatma', 'mahremiyet', 'gizlilik'],
  t6: ['bes', 'bireysel emeklilik', 'otomatik katılım'],
  t7: ['tavan', 'prime esas kazanç', 'pek', 'sgk tavanı'],
  t8: ['yıllık izin', 'izin', 'ücretli izin', 'izin devri'],
  t9: ['puantaj', 'devam', 'çalışma günü', 'vardiya planı'],
  t10: ['kıdem', 'kıdem tazminatı', 'tazminat', 'giydirilmiş'],
  t11: ['ihbar', 'ihbar öneli', 'önel', 'bildirim süresi'],
  t12: ['asgari ücret', 'asgari', 'ücret desteği'],
  t13: ['doğum izni', 'analık', 'süt izni', 'istirahat'],
  t14: ['bordro', 'bordro kontrol', 'maaş hesabı', 'matrah']
};

/**
 * Bilgi Bankası dökümanları.
 *
 * `dok3` BİLİNÇLİ olarak metinsiz: indekslenmemiş belgenin listede rozetle
 * göründüğünü ve Dasi'nin onu kaynak olarak kullanmadığını test edebilmek için
 * (V42'deki `dok5` ile aynı amaç, 03 §3 dürüstlük kuralı).
 */
export const seedDocuments: KnowledgeDocument[] = [
  {
    id: 'dok1',
    name: 'SGK 2026 Prime Esas Kazanç Tavan ve Taban Tutarları',
    file_name: 'sgk-2026-pek-tutarlari.pdf',
    mime_type: 'application/pdf',
    size_bytes: 284_512,
    tag_id: ['t1', 't12'],
    uploaded_by: 'u3',
    uploaded_at: '2026-07-14T10:20:00',
    extracted_text:
      '2026 yılı için prime esas kazancın alt sınırı brüt asgari ücrete, üst sınırı ise alt sınırın 7,5 katına eşittir. Tavanı aşan ödemeler prime tabi tutulmaz; ancak gelir vergisi ve damga vergisi matrahına dahil edilir.',
    indexed: true
  },
  {
    id: 'dok2',
    name: 'Kıdem Tazminatı Hesaplama Rehberi',
    file_name: 'kidem-tazminati-rehber.docx',
    mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size_bytes: 96_240,
    tag_id: ['t2'],
    uploaded_by: 'u3',
    uploaded_at: '2026-06-28T15:05:00',
    extracted_text:
      'Kıdem tazminatı, giydirilmiş brüt ücret üzerinden her tam yıl için 30 günlük ücret esas alınarak hesaplanır. Giydirmeye süreklilik arz eden yol, yemek ve ikramiye gibi ödemeler dahil edilir; arızi ödemeler dahil edilmez.',
    indexed: true
  },
  {
    id: 'dok3',
    name: 'İş Kanunu Değişiklik Taslağı (taranmış)',
    file_name: 'is-kanunu-taslak-tarama.pdf',
    mime_type: 'application/pdf',
    size_bytes: 1_842_900,
    tag_id: [],
    uploaded_by: 'u4',
    uploaded_at: '2026-08-11T09:40:00',
    indexed: false
  }
];
