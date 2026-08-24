# Bilgi Bankası Prototipinin `knowledge-ui`'a Taşınma Planı

Kaynak: `Knowledge-Base-PRD/app` (framework'süz prototip · 17 sayfa · ~17.400 satır JS · 5.900 satır CSS)
Hedef: `src/` (Next.js 14 App Router · TypeScript strict · MUI v6 · `@datassist/ui-shell-next`)

## Onaylanmış kararlar

| # | Karar | Sonuç |
|---|---|---|
| K1 | **İngilizce kod, Türkçe arayüz** | Route ve tanımlayıcılar İngilizce (`/knowledge/questions`, `getQuestions`), kullanıcının gördüğü her metin `i18n` üzerinden Türkçe. Prototip↔hedef eşlemesi §2 ve §3'te. |
| K2 | **MUI bileşeni + Tailwind stil** | Davranış/erişilebilirlik MUI bileşenlerinden (Dialog, Menu, Chip, Button, Collapse); tüm görsel stil Tailwind sınıflarıyla. Renk kaynağı hâlâ MUI teması: Tailwind renkleri MUI CSS değişkenlerinden okur, böylece koyu tema tek yerden gelir. Ayrıntı: §12. |
| K3 | **İki adaptör, mock varsayılan** | Her api fonksiyonu hem `mock` hem `http` adaptörüne sahip; varsayılan `mock`. Gerçek endpoint yolları `Tanıtım/13-api-sozlesmesi.md`'den şimdiden tanımlanır. |
| K4 | **Rol kaynağı şimdilik geçici** | Rol tek bir fonksiyondan okunur (`getCurrentUser`), geliştirici rol değiştiricisi ile test edilir. Backend claim/endpoint netleşince yalnızca o fonksiyon değişir. |
| K5 | **Şirket dokümanları kapsam dışı** | Prototipin V42 doküman yönetimi (yükleme/silme/önizleme) taşınmaz — ayrıca ve farklı bir yaklaşımla gelecek. Ayrıntı: §8. |

## 1. Mimari kurallar (bozulmayacak)

1. **Hiçbir sayfa mock veriye dokunmaz.** Tüm veri erişimi `src/modules/knowledge/api/*` üzerinden. Prototipin `denetim.sh` kuralının yerini ESLint `no-restricted-imports` alır (`mocks/*` yalnızca `api/adapters/mock.ts` tarafından import edilebilir).
2. **Sidebar tek kaynaktan gelir:** `src/components/app-shell/module-registry.ts`. Prototipin `app-shell.js` (365 satır) taşınmaz — kabuk `@datassist/ui-shell-next`'ten geliyor.
3. **Yetki iki katmanlı:** modül kapısı `withModulePermission` (mevcut), rol kapısı `useKnowledgeRole()` + `<RequireRole>` (yeni). Prototipin `saltOkur` davranışı rol kapısının bir parçası.
4. **Şirkete özel içerik kapısı (Ç8) ve KB yayın kuralı (V25)** api katmanında tek noktada uygulanır, sayfalarda tekrarlanmaz.
5. **Endpoint yolları Türkçe kalır** — bunlar backend'in sözleşmesi. TS fonksiyonu `getQuestions()`, çağırdığı yol `/sorular`. Taban yol tek sabitte: `KNOWLEDGE_API_BASE`.

## 2. Route eşlemesi

| Prototip | Hedef route | Dosya |
|---|---|---|
| `index.html` (rol seçici) | — | **Taşınmaz**, SSO yerini alıyor |
| `dasi.html` | `/knowledge/dasi` | `knowledge/dasi/page.tsx` |
| `ana-sayfa.html` | `/knowledge` | `knowledge/page.tsx` (mevcut yer tutucu değişir) |
| `sorular.html` | `/knowledge/questions` | `knowledge/questions/page.tsx` |
| `yeni-soru.html` | `/knowledge/questions/new` | `knowledge/questions/new/page.tsx` |
| `havuz.html` | `/knowledge/escalations` | `knowledge/escalations/page.tsx` |
| `raporlanan.html` | `/knowledge/reported` | `knowledge/reported/page.tsx` |
| `bilgi-bankasi.html` | `/knowledge/articles` | `knowledge/articles/page.tsx` |
| `sirketler.html` | `/knowledge/companies` | `knowledge/companies/page.tsx` |
| `sirket.html?id=` | `/knowledge/companies/[id]` | `knowledge/companies/[id]/page.tsx` |
| `know-how.html` | `/knowledge/notes` | `knowledge/notes/page.tsx` |
| `bulten.html` | `/knowledge/bulletin` | `knowledge/bulletin/page.tsx` |
| `bulten-detay.html?id=` | `/knowledge/bulletin/[id]` | `knowledge/bulletin/[id]/page.tsx` |
| `etiketler.html` | `/knowledge/tags` | `knowledge/tags/page.tsx` |
| `kullanicilar.html` | `/knowledge/users` | `knowledge/users/page.tsx` |
| `roller.html` | `/knowledge/roles` | `knowledge/roles/page.tsx` |
| `ayarlar.html` | `/knowledge/settings` | `knowledge/settings/page.tsx` |
| `metrikler.html` | `/knowledge/metrics` | `knowledge/metrics/page.tsx` |

Query parametreleri path parametresine dönüyor — prototipin NOTLAR §4'te "framework yok diye query kullandım" dediği kısıt kalkıyor.

## 3. API fonksiyon eşlemesi (39 fonksiyon)

| Prototip | Hedef | Endpoint (13-api-sozlesmesi) |
|---|---|---|
| `getMevcutKullanici` | `getCurrentUser` | `GET /me` |
| `setMevcutKullanici` | `setCurrentUser` | *mock-only (rol değiştirici)* |
| `sifirlaPrototipVerisi` | `resetMockData` | *mock-only* |
| `getSorular` | `getQuestions` | `GET /sorular` |
| `getSoru` | `getQuestion` | `GET /sorular/:id` |
| `postSoru` | `createQuestion` | `POST /sorular` |
| `degerlendirCevap` | `rateAnswer` | `POST /cevaplar/:id/degerlendir` |
| `postDerinArastirma` | `startDeepResearch` | `POST /sorular/:id/derin-arastirma` |
| `getHavuz` | `getEscalationPool` | `GET /havuz` |
| `cevaplaSoru` | `answerQuestion` | `POST /sorular/:id/uzman-cevap` |
| `postGeribildirim` | `createFeedback` | `POST /geribildirim` |
| `getGeribildirimOzeti` | `getFeedbackSummary` | `GET /geribildirim` |
| `dogrulaCevap` | `verifyAnswer` | `POST /cevaplar/:id/dogrula` |
| `getKBKayitlari` | `getArticles` | `GET /kb-kayitlari` |
| `getKBKaydi` | `getArticle` | `GET /kb-kayitlari/:id` |
| `postKBKaydi` | `createArticle` | `POST /kb-kayitlari` |
| `guncelleKBKaydi` | `updateArticle` | `PATCH /kb-kayitlari/:id` |
| `postFlag` | `createFlag` | `POST /flag` |
| `getFlagListesi` | `getFlags` | `GET /flag` |
| `guncelleFlag` | `updateFlag` | `POST /flag/:id/guncelle` |
| `getSirketler` | `getCompanies` | `GET /sirketler` |
| `getSirketSayfasi` | `getCompanyPage` | `GET /sirketler/:id` |
| `postKnowHow` | `createNote` | `POST /sirketler/:id/know-how` |
| `getKnowHowNotlari` | `getNotes` | `GET /know-how` |
| `birlestirSirket` | `mergeCompanies` | `POST /sirketler/birlestir` |
| `getEtiketler` | `getTags` | `GET /etiketler` |
| `postEtiket` | `createTag` | `POST /etiketler` |
| `guncelleEtiket` | `updateTag` | `PATCH /etiketler/:id` |
| `oneriEtiketler` | `suggestTags` | `POST /etiketler/oner` |
| `getKullanicilar` | `getUsers` | `GET /kullanicilar` |
| `guncelleKullanici` | `updateUser` | `PATCH /kullanicilar/:id` |
| `getBulten` | `getBulletins` | `GET /bulten` |
| `getMetrikler` | `getMetrics` | `GET /metrikler` |
| `getMevzuatKaynaklar` | `getLegislationSources` | `GET /mevzuat-kaynaklar` |

**Sözleşmede karşılığı olmayan 5 fonksiyon** — prototip inşası sırasında eklenmiş, backend ekibine bildirilecek:
`getFlagBildirimleri`, `yanitlaFlagBildirimi`, `getBultenKaydi`, `getMevzuatIcerikleri`, `getSayaclar` (sidebar sayaçları).

Ters yön: sözleşmedeki `getOnayKuyrugu` / `onaylaKBKaydi` / `reddetKBKaydi` / `postKBOnerisi` prototipte **yok** — NOTLAR V44 ile doğrulama kuyruğu kaldırılmış. Gerçekleşen prototip baz alınır.

## 4. Klasör yapısı

```
src/modules/knowledge/
├── api/
│   ├── index.ts              # dışa açık 43 fonksiyon (tek servis katmanı)
│   ├── adapters/mock.ts      # mocks/* okuyan tek dosya
│   ├── adapters/http.ts      # /api/knowledge/* proxy'sine giden tek dosya
│   ├── access.ts             # Ç8 şirket erişim kapısı + V25 KB kuralı
│   └── endpoints.ts          # KNOWLEDGE_API_BASE + yol sabitleri
├── mocks/                    # mock-data.js → 15 tipli koleksiyon
├── types/                    # Question, Answer, Article, Company, Flag, …
├── contexts/role-context/    # useKnowledgeRole, RequireRole
├── components/
│   ├── common/               # ui.js karşılıkları (§5)
│   ├── dasi/                 # durum makinesi + medya + sohbet
│   └── <feature>/            # sayfa başına bileşenler
├── hooks/
└── constants.ts              # config.js tabloları (durum, gizlilik, kaynak tercihi)
```

## 5. `ui.js` → bileşen eşlemesi (Faz 2)

| Prototip | Hedef |
|---|---|
| `rozet`, `verifiedRozet`, `gizlilikRozet` | `<StatusChip>`, `<VerifiedBadge>`, `<PrivacyChip>` |
| `etiketler` | `<TagChips>` |
| `bosDurum` | `<EmptyState>` |
| `yukleniyor` | `<ListSkeleton>` |
| `hataKutu` / `bilgiKutu` / `uyariKutu` | `<Alert severity>` (MUI) |
| `toast` | `sonner` (projede kurulu) |
| `modal` / `onayla` / `metinSor` | `<Dialog>` + `useConfirmDialog()` / `usePromptDialog()` |
| `artimliListe` | `<IncrementalList>` ("Daha fazla göster") |
| `acilirYap` | `<SearchSelect>` (MUI Autocomplete) |
| `tarih`, `tarihSaat`, `gecenSure`, `saatSure` | `utils/format-date.ts` (dayjs — kurulu) |
| `maskeliNot`, `bas`, `kisalt`, `kacir`, `param` | `utils/*` (`kacir` gereksiz — React kaçışı yapıyor) |
| `guvenli`, `butonlaCalis` | `useAsyncAction()` |
| `daktilo` | `<Typewriter>` (Dasi'ye özel) |
| `ikonlar.js` (48 SVG) | Phosphor eşlemesi + karşılığı olmayanlar için `components/common/icons` |

## 6. Yürütme biçimi: ekran ekran (dikey dilim)

Faz faz her şeyi birden değil, **sidebar ekranlarını tek tek** taşıyoruz (kullanıcı kararı).
Her ekran kendi dikey dilimiyle gelir: o ekranın kullandığı api fonksiyonları, mock verisi ve
ortak bileşenler o turda yazılır; sonraki ekran bunların üstüne biner.

`src/modules/knowledge/navigation.ts` → `MIGRATED_ROUTES` bu ilerlemenin tek kaydı: bir ekran
bittiğinde oraya bir satır eklenir, madde sidebar'da görünür ve ekran içi bağlantıları
tıklanabilir hâle gelir. Henüz taşınmamış hedefe link verilmez — kullanıcı var olmayan bir
route'a düşmez, bunun yerine "Bu ekran henüz taşınmadı" ipucu görür.

Aşağıdaki tablo iş kalemlerinin kapsamını gösterir; sıra kullanıcının istediği ekranla belirlenir.

## 6b. Kapsam tablosu

| Faz | Kapsam | Doğrulama |
|---|---|---|
| **0. Temel** | Klasör iskeleti · `paths.ts` 17 route · `module-registry` 4 grup + rol filtresi · `constants.ts` · tema token köprüsü · rol context'i · i18n anahtar iskeleti · ESLint import kuralı | `build` geçiyor; boş route'lar kabuk içinde doğru sidebar ve rolle açılıyor |
| **1. Veri katmanı** | `mocks/*` (15 koleksiyon, tipli) · `types/*` · 39 fonksiyon + iki adaptör · `access.ts` | `typecheck` temiz; her fonksiyon mock veriyle beklenen şekli döndürüyor |
| **2. Ortak UI** | §5 tablosunun tamamı | Demo sayfada tüm primitive'ler light + dark modda çalışıyor |
| **3. Çekirdek** | `dasi` · `/knowledge` panosu · `questions` · `questions/new` | Uçtan uca: soru sor → Dasi cevap → yetersiz → eskalasyon |
| **4. İş akışı** | `escalations` (570 satır) · `reported` (383 satır) | Uzman rolüyle cevaplama + flag çözümleme |
| **5. Bilgi** | `articles` · `companies` · `companies/[id]` (865 satır → doküman sekmesi hariç, yine de en ağır) · `notes` · `bulletin` · `bulletin/[id]` · `tags` | Ç8 erişim kapısı ve V25 yayın kuralı korunuyor |
| **6. Yönetim** | `users` · `roles` · `settings` · `metrics` | Admin dışı roller 403 alıyor |
| **7. Cila** | Dark mode · responsive · a11y · `en.json` · lint/typecheck/build sıfır hata · prototip klasörünün tasfiyesi | Üç komut temiz |

## 7. Riskler ve açık uçlar

- **`AppShellLayout` çok gruplu mod.** 4 sidebar grubu verildiğinde `knowledge-shell.tsx` `mode`'u `multi-module`'a çeviriyor (`groups.length > 1`). Faz 0'da görsel doğrulama; olmazsa tek grup + nested `items`.
- **Dasi medyası.** 5 mp4 + 10 png `public/assets/dasi/`'ye taşınır. Prototipin "siyah zemini çalışma anında saydamlaştırma" hack'i (alpha kanallı sürüm gelene kadar) birebir taşınacak.
- **Figtree fontu.** Prototipte self-hosted woff2; hedefte `@fontsource/*` paketleri var. Kabuk tipografisiyle çakışma Faz 0'da netleşir.
- **Kapsam dışı:** PWA manifest / service-worker / `denetim.sh` (Next.js kendi build'ini yönetiyor; mimari kural ESLint'e devrediliyor).
- **Prototip klasörü.** `Knowledge-Base-PRD/` kendi `.git`'ini taşıyor (iç içe repo) ve untracked. Taşıma süresince `.gitignore`'a; bitince `docs/prototype/`'a referans olarak alınır ya da silinir. Silme kararı kullanıcıya ait.

## 8. Kapsam dışı: şirket dokümanları (V42)

Prototipin şirket dosyasına belge yükleme özelliği **taşınmaz** — ayrıca ve farklı bir
yaklaşımla gelecek (K5). Kapsamdan çıkan parçalar:

| Parça | Yer |
|---|---|
| 4 api fonksiyonu: `getSirketDokumanlari`, `getDokuman`, `postDokuman`, `silDokuman` | `api-client.js` |
| `mockSirketDokumanlari` koleksiyonu (~210 satır) | `mock-data.js` |
| `DOKUMAN_TURLERI` + `DOKUMAN_YUKLEME` tabloları | `config.js` |
| Şirket sayfasının "Dokümanlar" sekmesi: `dokumanPanelHTML`, yükleme kutusu, önizleme ve silme akışı (~70 satır) | `sirket.js` |
| Doküman kart/liste stilleri (~30 satır) | `styles.css` |

Sonuç: `companies/[id]` **iki sekmeli** olur — *Sorular* ve *Operasyon notu*.

Kontrol edilmiş, etkilenmeyen iki nokta:

- `answerQuestion(..., { ekler })` — uzman cevabına eklenen serbest kaynak/link listesi,
  şirket dokümanıyla ilgisi yok. **Kapsamda kalır.**
- Dasi cevaplarındaki `dokuman_referanslari` bloğu (cevabın bir belgenin bölümüne atıf
  vermesi) mock veride hiç kullanılmıyor — prototipte ölü kod. Taşımaya girmez; doküman
  özelliği geldiğinde Dasi cevap balonunda açılacak tek nokta olarak not edildi.

## 9. Taşıma durumu

| Ekran | Durum |
|---|---|
| `dasi` → `/knowledge/dasi` | **Taşındı** (§10) |
| `sorular` → `/knowledge/questions` | **Taşındı** (§14) |
| `ana-sayfa` → `/knowledge` | **Taşındı** (§18) |
| Diğer 13 ekran | Bekliyor |

Kullanıcı kararı: Ana Sayfa ekranı önce atlanıp sıra Sorular ekranına verilmişti; Sorular
bittikten sonra Ana Sayfa'ya dönüldü.

## 10. Dasi ekranı — taşındı

Dasi'nin dikey dilimiyle birlikte gelen altyapı:

| Katman | Dosya |
|---|---|
| Tipler (03 §2 veri modeli) | `src/modules/knowledge/types/index.ts` |
| Tohum veri (15 koleksiyon) | `src/modules/knowledge/mocks/seed-data.ts` |
| Servis katmanı + adaptör seçimi | `src/modules/knowledge/api/index.ts` |
| Mock adaptörü (depo, erişim kapısı, maskeleme) | `src/modules/knowledge/api/adapters/mock/` |
| HTTP adaptörü (proxy'ye gider) | `src/modules/knowledge/api/adapters/http.ts` |
| Endpoint yolları | `src/modules/knowledge/api/endpoints.ts` |
| Sabitler (Dasi asset tablosu, gizlilik, kaynak tercihi) | `src/modules/knowledge/constants.ts` |
| Sidebar yapısı + rol filtresi + taşınma kaydı | `src/modules/knowledge/navigation.ts` |
| Rol kapısı (`useKnowledgeRole`) | `src/modules/knowledge/contexts/role-context/` |
| Ortak bileşenler | `components/common/{status-chip,tag-chip,typewriter}.tsx` |
| Dasi bileşenleri | `components/dasi/` (medya, durum makinesi, hero, soru kutusu, balonlar, keşif) |
| Sayfa | `src/app/(authenticatedPages)/knowledge/dasi/page.tsx` |

Bu turda taşınan api fonksiyonları (11): `getCurrentUser`, `setCurrentUser`, `resetMockData`,
`getTags`, `suggestTags`, `getCompanies`, `getArticles`, `getQuestion`, `createQuestion`,
`rateAnswer`, `verifyAnswer`, `startDeepResearch`.

Korunan davranışlar: Dasi durum makinesi ve geçiş kuralları (14 §5), videoların siyah zeminini
çalışma anında saydamlaştırma, hareket azaltma tercihinde statik görsele düşme, "animasyon bir
tur atsın" ritmi (süre klipten okunur), eşleşme bulunmayınca **uydurma cevap üretilmemesi**
(Vizyon İlke #1), Ç8 şirket erişim kapısı, KVKK maskeleme, derin araştırma modunun tek
seferlik olması, etiket renklerinin havuz sırasından türetilmesi.

Sadeleşen yer: prototipin hero'yu ölçüp piksel piksel kapatan `sohbetModunaGec` hack'i yerine
MUI `Collapse` kullanıldı. Kaldırılan yer: köşedeki gömülü Dasi widget'ı (`koseDasiEkle`) ve
iframe'li gömülü kip — kabuk artık tek uygulama olduğu için ekranlar arası iframe gerekmiyor;
ihtiyaç doğarsa ayrıca değerlendirilecek.

Not: tipografi projenin mevcut fontu (Inter) üzerinden gidiyor; prototipin Figtree'si
taşınmadı. Kabukla tutarlılık için bilinçli bırakıldı, global bir tipografi kararı olarak
ayrıca ele alınmalı.

### Taşıma dışı düzeltme: SSO girişi tamamlanamıyordu

`src/contexts/auth-context/auth-context.tsx` — login effect'i birden fazla kez koşuyordu
(React 18 dev modunda effect'ler iki kez çalışır; ayrıca `useSearchParams()` her render'da
yeni referans döndürebildiği için bağımlılık listesi de yeniden tetikleniyordu). OAuth
authorization code tek kullanımlık olduğundan ikinci denemede SSO `invalid_grant` dönüyor, bu
hata `login()` içindeki catch'e düşüyor ve `clearTokenCookie()` çağrılarak **ilk denemenin
yazdığı geçerli token siliniyordu** — giriş hiç tamamlanamıyordu.

Düzeltme: `loginAttemptedRef` guard'ı ile authorization code yalnızca bir kez token'a
çevriliyor. Taşımayla ilgisi yok, ancak taşınan ekranların hiçbiri denenemediği için burada
düzeltildi.

## 12. Tailwind kurulumu

Stiller `sx` yerine Tailwind sınıflarıyla yazılıyor (K2). Kurulum kararları:

| Karar | Neden |
|---|---|
| `corePlugins.preflight = false` | MUI `CssBaseline` zaten reset uyguluyor; ikinci bir reset MUI tipografisini ve form elemanlarını bozuyordu. |
| `important: '#app-root'` | Utility'ler `#app-root .flex { … }` olarak üretilir; specificity MUI'nin emotion sınıflarının üstüne çıkar, `!important` serpmeye gerek kalmaz. Kök id `src/app/layout.tsx`'teki `<body>`'de. |
| `darkMode: ['selector', '[data-mui-color-scheme="dark"]']` | Koyu tema anahtarı MUI ile aynı; `dark:` varyantı MUI'nin şema attribute'una bağlanır, ikinci bir tema anahtarı doğmaz. |
| Renkler MUI CSS değişkenlerinden | `primary`, `success`, `fg`, `border` … hepsi `var(--mui-palette-*)` okur. `mainChannel` değişkenleri "R G B" döndüğü için `bg-primary/15` gibi opaklık sözdizimi de çalışır: → `rgb(var(--mui-palette-primary-mainChannel) / 0.15)`. Tek renk kaynağı tema dosyaları olarak kalır. |
| MUI'de karşılığı olmayan değerler `global.css`'te | Derin Araştırma moru, hero ışık halesi ve 8'li etiket paleti `--kb-*` token'ları olarak; koyu tema karşılıkları hemen altında. Tailwind bunları `bg-[var(--kb-tag-0-bg)]` biçiminde okur. |

İki tuzak, ikisi de bu turda yaşandı:

1. **Dinamik sınıf adı üretilemez.** `bg-tag-${i}` gibi çalışma anında kurulan adları Tailwind
   derleme sırasında göremez ve CSS üretmez. Etiket ve kart renkleri bu yüzden tam string
   olarak dizilerde duruyor (`tag-chip.tsx`, `discovery-section.tsx`).
2. **Ölçekte olmayan spacing sessizce kaybolur.** `gap-4.5` / `py-5.5` Tailwind'in varsayılan
   ölçeğinde yok; hata vermez, sadece hiç stil üretmez. Prototipin 18px/22px gibi ölçüleri
   arbitrary değerle yazıldı (`gap-[18px]`).

Doğrulama: `npx tailwindcss -c tailwind.config.ts -i <probe.css> -o <out.css>` ile üretilen
CSS'te beklenen sınıflar tek tek arandı; ayrıca dev sunucusunun servis ettiği
`/_next/static/css/app/layout.css` içinde `#app-root`, `animate-kb-star`, `rounded-composer`,
`kb-tag-0-bg` sınıflarının varlığı teyit edildi.

## 13. Backend endpoint sözleşmesi

Dasi ekranının ihtiyaç duyduğu 9 endpoint, istek/yanıt örnekleri ve iş kurallarıyla:
`docs/dasi-endpoint-sozlesmesi.md`. Backend ekibine doğrudan verilebilir.

## 14. Sorular ekranı — taşındı

Prototip karşılığı: `sorular.html` + `js/pages/sorular.js` (511 satır).

| Parça | Dosya |
|---|---|
| Ekran (liste, filtreler, sayfalama) | `components/questions/questions-screen.tsx` |
| Soru detayı | `components/questions/question-detail-dialog.tsx` |
| Uzman cevabı kartı | `components/questions/expert-answer-card.tsx` |
| Sayfa | `src/app/(authenticatedPages)/knowledge/questions/page.tsx` |

Bu turda gelen ortak parçalar (sonraki ekranlar kullanacak): `components/common/user-avatar.tsx`,
`components/common/empty-state.tsx`, `hooks/use-prompt-dialog.tsx`, `utils/format-date.ts`.

Bu turda eklenen api fonksiyonları (5): `getQuestions`, `getUsers`, `createFeedback`,
`getFeedbackSummary`, `createFlag`.

Korunan davranışlar: V43 süzgeci (ekranda yalnızca `eskale_edildi` ve uzman cevabı olan
`cozuldu` kayıtları görünür — Dasi'nin kendi çözdükleri uzman çalışma alanına girmez), detayda
yalnızca `tip: uzman` cevapların listelenmesi, Ç8 şirket filtresi (yalnızca erişilebilir
şirketler), KVKK maskeleme ve kişisel veri işareti, raporun kişiye değil havuza gitmesi, PII
gerekçeli raporun öncelikli işaretlenmesi, cevap metnindeki soru tekrarının ayıklanması,
⌘K ile aramaya odaklanma, 10'luk numaralı sayfalama.

**Bilinçli olarak taşınmayan iki prototip davranışı** (`gorunumSorulariniHazirla`):

1. **Kozmetik etiket doldurma.** Prototip, etiketi az olan satırlara havuzdan sırayla etiket
   ekleyip listeyi dolu gösteriyordu. Gerçek veride bu, kullanıcıya o soruya ait OLMAYAN bir
   etiketi göstermek demek — ürünün "asla uydurma" ilkesiyle çelişir.
2. **Mükerrer soru metinlerinin ayıklanması.** Aynı metnin farklı kayıtlarından yalnızca en
   günceli gösteriliyordu. Bu bir veri kalitesi sorununu arayüzde maskeliyor; mükerrer kayıt
   varsa görünmesi gerekir (ve çözümü backend tarafında).

Ayrıca avatar: prototip sabit bir görsel sprite kullanıyordu (`assets/avatars`); kullanıcı
kümesi sabit olmadığı için baş harfli MUI `Avatar`'a geçildi (`get-initials` util'i ile).

## 15. Kaldırılan kapsam: Derin Araştırma ve kaynak tercihi

Kullanıcı kararı (backend sözleşmesi sadeleştirildikten sonra): Derin Araştırma ve kaynak
tercihi **üründen çıkarıldı**. Kaldırılanlar:

| Katman | Ne kalktı |
|---|---|
| Arayüz | Soru kutusundaki "Derin araştırma" mod toggle'ı ve "Kaynak: …" seçicisi; cevap altındaki "Derin Araştırma yap" düğmesi; derin araştırma rozeti; "Taranan kaynaklar" listesi; kaynak kuralı uyarıları (K-3/K-7) |
| Durum makinesi | `deep-research` state'i — `DasiState`, `DASI_ASSETS`, `DASI_TRANSITIONS` |
| Api katmanı | `startDeepResearch` (mock + http), `endpoints.deepResearch` |
| Tipler | `SourcePreference`, `ScannedSource`, `Question.kaynak_tercihi`, `CreateQuestionInput.kaynak_tercihi`, `Answer.taranan_kaynaklar`, `Answer.uyarilar` |
| Metinler | `knowledge.source.*` bloğu ve `knowledge.dasi` altındaki derin araştırma anahtarları; "bulunamadı" akışındaki teklif artık yalnızca uzman havuzunu öneriyor |

Korunanlar ve nedenleri:

- **`AnswerType`'ta `derin_arastirma` değeri kaldı.** Tohum veride bu tipte bir cevap var (`c8`);
  veri modelinden çıkarmak tohum veriyi geçersiz kılardı. Arayüz artık bu tipte cevap üretmiyor
  ve gösterdiği tek yer olan Sorular ekranı yalnızca `tip: uzman` listeliyor.
- **`gizlilik_sinifi` kaldı.** Sadeleştirilmiş sözleşmede gövde örneğinde geçmiyor ama kapsam
  dışı olarak da işaretlenmemiş; KVKK maskeleme davranışını (04-KVKK §3) ve Sorular ekranındaki
  "Kişisel Veri İçerir" işaretini bu alan sürüyor. Kaldırılması gerekiyorsa ayrıca belirtilmeli.
- `seed-data.ts` içindeki `seedDeepResearchMap` tohum verisi silinmedi (kullanılmıyor, arşiv
  olarak duruyor).

## 16. Koyu tema uyumu (Dasi + Sorular)

Tailwind renkleri MUI CSS değişkenlerinden okuduğu için tema geçişi kendiliğinden çalışıyordu,
ancak iki tür sorun kaldığı ölçülerek bulundu (renk değerleri üzerinden WCAG kontrast hesabı,
tarayıcı gerekmeden):

### 1. Temadan bağımsız iki sabit renk

| Yer | Eski | Yeni |
|---|---|---|
| Karşılama ekranı parıltı noktaları | `bg-white` + sabit beyaz gölge | `bg-star` + `--kb-star-glow` token'ı; açık temada marka mavisinin açık tonu, koyu temada beyaz |
| Uzman cevabındaki doğrulama tiki | `bg-success` dolu daire + beyaz tik (koyu temada 1.9:1 → okunmuyordu) | Zemin kaldırıldı, ikon `text-success-strong dark:text-success-light` |

### 2. Rozet kontrastları — açık temada da kırıkmış

Asıl bulgu: `bg-success/15 text-success` kalıbı hem zemin hem metin için AYNI ana tonu
kullanıyordu. Ölçüm sonuçları (açık tema): success 2.20:1, info 2.33:1, warning 1.90:1,
error 3.09:1 — hepsi WCAG AA eşiğinin (4.5:1) altında. Yani bu bir koyu tema hatası değil,
baştan beri var olan bir okunabilirlik hatasıydı; koyu tema çalışması onu ortaya çıkardı.

Çözüm: Tailwind paletine her semantik renk için `strong` tonu eklendi
(`var(--mui-palette-<tone>-700)`). Kalıp artık:

```
bg-<tone>/15  text-<tone>-strong  dark:text-<tone>-light
```

Yumuşak zemin üzerinde açık temada 700 tonu, koyu temada `light` tonu kullanılıyor. Aynı
düzeltme etiket çipi dışındaki tüm rozet/ikon yüzeylerine uygulandı (durum rozetleri, keşif
kartı ikonları, avatar baş harfleri, kişisel veri işaretleri, "Genel mevzuat" ikonu).

### Ölçülen son durum

Her iki temada tüm metin/zemin çiftleri AA eşiğini geçiyor. En düşük değerler: koyu temada
kullanıcı balonu 4.81:1, açık temada warning rozeti 4.56:1.

Tek istisna: karşılama ekranındaki parıltı noktaları açık temada 2.16:1'de kalıyor. Bunlar
tamamen dekoratif (ışık halesinin üzerinde duran süs noktaları), anlam taşımıyor ve WCAG
grafik kontrast kuralının kapsamına girmiyor.

Not: bu tur **ölçümle** doğrulandı, görsel olarak değil. Koyu temada gözle bakıldığında
Dasi'nin videolarının koyu zeminde nasıl durduğu ayrıca değerlendirilmeli — videoların zemini
siyah kaydedilip çalışma anında saydamlaştırıldığı için figürün koyu konturları koyu arka planla
yakınlaşabilir (asset kaynaklı, kodla çözülmez).

## 17. Kabuk: paket yerine prototipin kendi sidebar/topbar'ı

Kullanıcı kararı: `@datassist/ui-shell-next` paketinin `AppShellLayout`'u bırakıldı, prototipin
kabuğu birebir yazıldı. Gerekçe: paket kabuğu açık zeminli ve farklı yapıdaydı; referans
tasarımı CSS ile ezmeye çalışmak hem kırılgandı (300 satırlık `GlobalStyles` bloğu) hem de paket
güncellendiğinde bozulacaktı.

| Parça | Dosya |
|---|---|
| Düzen (sabit sidebar + sabit topbar + içerik) | `src/components/app-shell/knowledge-shell.tsx` |
| Sidebar (koyu lacivert panel) | `src/components/app-shell/knowledge-sidebar.tsx` |
| Üst çubuk | `src/components/app-shell/knowledge-topbar.tsx` |

Prototipten taşınan ölçü ve davranışlar: sidebar 226px sabit, topbar 68px sabit; logo 132px +
altında uygulama adı; bölüm başlıkları 10.5px uppercase `.11em` harf aralığı; menü maddesi 38px
yüksek, 8px yuvarlak; aktif maddede hafif beyaz zemin + sol kenarda 2px mavi çubuk; altta üst
çizgiyle ayrılmış kullanıcı kartı (30px kare avatar, çevrimiçi noktası, ad + rol).

Kararlar:

- **Sidebar her iki temada koyu kalır.** Uygulamanın görsel kimliği bu panelde; açık temada
  beyaza dönmesi referans tasarımı bozuyor. Bu yüzden renkleri MUI paletinden değil
  `--kb-sidebar-*` token'larından besleniyor (`global.css`).
- **İçerik zemini ile kart zemini ayrıldı.** Açık temada zemin hafif gri (`background.level1`),
  kartlar beyaz (`background.paper`); koyu temada sıra tersine döndüğü için zemin
  `background.default`'a düşüyor. Prototipteki gri zemin–beyaz kart ayrımı böylece iki temada
  da korunuyor.
- **Footer kaldırıldı.** Prototipte footer yok; paketin getirdiği "© 2026 · Yasal Uyarı · KVKK"
  çubuğu da kabukla birlikte gitti.
- **Bildirim zili taşınmadı.** Bildirim akışı (`getFlagBildirimleri`) henüz gelmedi ve prototip
  de liste ekranlarında zili gizliyordu.
- Kullanıcı kartı prototipte rol değiştiriciydi; burada gerçek oturum menüsünü (tema, dil,
  çıkış) açıyor.
- `HeaderActions`, paketin `topbar__actions` kabına göre `width: 100%` taşıyordu; kendi
  topbar'ımızda bu sol taraftaki sayfa adını sıkıştırdığı için kaldırıldı. Oturum avatarındaki
  bildirim noktasının sabit beyaz çerçevesi de temaya bağlandı.
- Yükleme iskeleti (`LoadingNav`) yeni kabuğun ölçülerine ve koyu sidebar'ına uyarlandı; açık
  panel gösterip hemen koyu laciverte atlaması göze batıyordu. `global.css` içindeki pakete özel
  zoom kuralları ve `logo.tsx` içindeki kullanılmayan kabuk kutuları da kaldırıldı.

`package.json`'daki `@datassist/ui-shell-next` bağımlılığı silinmedi — artık hiçbir yerden
import edilmiyor, kaldırılması ayrı bir karar.

### Not: "aydınlık mod bozuldu" bulgusu

Bildirilen bozulma yeni bir hata değildi: `tailwind.config.ts` değişikliklerini çalışan Next dev
sunucusu sıcak yüklemiyor. §16'daki rozet düzeltmeleri (`text-*-strong`) canlı CSS'e hiç
girmemişti, ekranda eski (okunmayan) hâl duruyordu. Sunucu yeniden başlatıldıktan sonra
üretilen CSS'te `#app-root .text-warning-strong { color: var(--mui-palette-warning-700) }`
kuralı doğrulandı.

**Kural:** `tailwind.config.ts` ya da `postcss.config.js` değiştiğinde dev sunucusu yeniden
başlatılmalı; aksi hâlde değişiklik tarayıcıya ulaşmaz.

## 18. Ana Sayfa ekranı — taşındı

Prototip karşılığı: `ana-sayfa.html` + `js/pages/ana-sayfa.js` (201 satır).

| Parça | Dosya |
|---|---|
| Ekran (veri toplama, rol farkı, ızgara) | `components/overview/overview-screen.tsx` |
| Kart kabuğu (üst etiket + başlık + aksiyon) | `components/overview/overview-card.tsx` |
| Metrik kartları | `components/overview/metric-card.tsx` |
| Son doğrulanan bilgiler listesi | `components/overview/verified-articles-card.tsx` |
| Bülten kartı | `components/overview/bulletin-card.tsx` |
| "Seni bekleyenler" kartı | `components/overview/pending-card.tsx` |
| Sayfa | `src/app/(authenticatedPages)/knowledge/page.tsx` (yer tutucu kalktı) |

Bu turda gelen ortak parça: `components/common/migration-link.tsx` — taşınmış hedefe bağlantı,
taşınmamışa "bu ekran henüz taşınmadı" ipucu üretir (plan §6 kuralı). Panoda dört metrik, altı
bilgi satırı, beş bülten satırı ve iki bekleyen satırı aynı şeye ihtiyaç duyduğu için Dasi'nin
keşif kartlarında elle yazılan kalıp bileşene çıkarıldı. Panonun linklerinin çoğu henüz
taşınmamış ekranlara (`/knowledge/articles`, `/knowledge/bulletin`, `/knowledge/escalations`,
`/knowledge/reported`) gittiği için ekran şu an ağırlıklı olarak bu pasif hâlde görünüyor.

Bu turda eklenen api fonksiyonları (3): `getEscalationPool` (`GET /havuz`), `getFlags`
(`GET /flag`), `getBulletins` (`GET /bulten`) — üçü de mock + http adaptörüyle. Yeni tipler:
`EscalationPoolItem`, `FlagListItem`, `BulletinListItem`.

Korunan davranışlar: rol farkı (ikinci metrik kartı ve "Seni bekleyenler" listesi uzman/admin
ile diğer rollerde farklı), "bugünün gelişmeleri" sayımının bültenin en yeni sayısından
türetilmesi, V44 sonrası metrik kartının kuyruk değil kalıcı bilgi hacmini göstermesi, havuzun
en uzun bekleyen üstte sıralanması, PII gerekçeli raporların öncelikli sırası, KVKK maskeleme.

**Prototipten üç sapma:**

1. **Doğrulama tiki artık gerçekten `verified` demek.** Prototip tüm KB kayıtlarını listeleyip
   her satıra yeşil doğrulama tiki basıyordu. Kartın adı "Son doğrulanan bilgiler" olduğu için
   satırlar `verified` süzgecinden geçiyor (tohum veride 31 kaydın tamamı verified, görünüm
   değişmiyor; kural gerçek veride önem kazanacak).
2. **`getEscalationPool` Ç8 kapısından geçiyor.** Prototipin `getHavuz`'u erişim kapısı
   uygulamıyordu. Uygulamada görünen sonuç aynı — havuzu yalnızca Bilgi Uzmanı ve Admin görür,
   ikisi de kapıdan muaf — ama kapının api katmanında tek noktada durması kuralı (§1.4) böylece
   havuzda da bozulmuyor.
3. **Rol kapısı okunmadan veri çekilmiyor.** Prototip `mevcutKullanici()`'yi senkron
   okuyabiliyordu; burada `useKnowledgeRole()` asenkron dolduğu için ekran rol gelene kadar
   iskelet gösteriyor — aksi hâlde "kendi sorularım" ve havuz sayıları bir an yanlış görünürdü.

Bülten kapak görselleri prototipten alındı: `app/assets/bulten/*.jpg` → `public/assets/bulletin/`.
Tohum verideki göreli yollar (`assets/bulten/…`) mutlak yola çevrildi (`/assets/bulletin/…`);
Next.js'te göreli yol mevcut route'a göre çözülür ve kırılırdı.

Doğrulama: ekran açık ve koyu temada, masaüstü ve tablet genişliğinde tarayıcıda görüntülendi
(gerçek rakamlar: 3 yeni bülten kaydı, 14 eskalasyon, 31 KB kaydı, 2 açık rapor); konsolda hata,
ağ isteklerinde 404 yok. SSO girişi olmadan görüntülemek için geçici bir önizleme route'u
kullanıldı ve doğrulamadan sonra silindi.
