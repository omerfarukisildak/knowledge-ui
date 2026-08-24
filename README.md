# knowledge-ui

Datassist **Knowledge** modülünün Next.js arayüzü. `sdp-ui` ile aynı yapısal iskelet üzerine kurulmuştur;
SSO/oturum katmanı, tema ve app shell ortak paketlerden gelir. Feature kodu içermez — modüller
`src/modules/<modul-adi>` altında büyütülmek üzere boş bırakılmıştır.

## Stack

| Paket | Sürüm | Not |
| --- | --- | --- |
| next | 14.2.35 | `@datassist/ui-shell-next` peer'i Next 14 istiyor |
| react / react-dom | 18.3.x | shell peer'i |
| @mui/material | 6.5.x | shell peer'i (`^6.3.1`) |
| @dakika/auth | 2.1.0 | SSO + token doğrulama (sdp-ui 1.0.1'de kalmıştı) |
| @datassist/ui-shell-next | 0.1.9 | ortak sidebar/topbar/footer |
| i18next / react-i18next | 26.x / 17.x | tr + en, yerel JSON sözlükler |
| typescript | 5.8.x | |

Diğer bağımlılıklar (axios, dayjs, sonner, prettier, eslint eklentileri) latest sürümlerinde.
Next/React/MUI'yi yükseltmek `@datassist/ui-shell-next`'in de yükseltilmesini gerektirir.

## Kurulum

```bash
nvm use
cp .env.local.example .env.local   # secret alanları devops'tan doldur
npm install
npm run run:local
```

`.npmrc` Nexus registry'sini işaret eder; private `@dakika/*` ve `@datassist/*` paketleri oradan gelir.

### Ortam değişkenleri

`.env` (repo'da) sadece uygulama kimliğini taşır: `APP_NAME` ve SSO token doğrulaması için `PRIVATE_KEY`.
Ortama özel dosyalar: `.env.dev`, `.env.test`, `.env.prod`, yerel geliştirme için `.env.local`.

Repodaki tüm env dosyalarında **secret alanlar boş bırakılmıştır** — aşağıdakiler devops'tan (ya da
`sdp-ui` deployment'ından) alınıp doldurulmalıdır:

- `PRIVATE_KEY` — SSO JWT doğrulama anahtarı
- `OAUTH_PASSWORD` — SSO client secret
- `ENCRYPTION_KEY`, `IV` — token cookie şifreleme

Kontrol listesi:

- `NEXT_PUBLIC_REDIRECT_URL` ilgili ortamın domain'i olmalı ve **SSO client'ında kayıtlı redirect URI**
  listesinde bulunmalı (`dakika3g-fe` client'ı kullanılıyorsa yeni domain'in eklenmesi gerekir).
- `BACKEND_API_URL` → `knowledge-backend` servisi.
- Zorunlu değişkenler `src/validate-env.ts` içinde listelidir; eksikse uygulama açılışta hata verir.

## SSO / oturum

Login akışı `sdp-ui` ile birebir aynıdır ve tamamen `@dakika/auth` üzerinden yürür:

1. `src/contexts/auth-context/auth-context.tsx` — token yoksa `redirectToLogin()` ile SSO'ya
   PKCE (`code_challenge`) ile yönlendirir; dönen `?code` ile `login()` çağrılır.
2. `src/contexts/auth-context/services.ts` — `'use server'`. SSO'dan access/refresh token alır,
   `/oauth/user` ile hesabı doğrular, token'ları şifreleyip cookie'ye yazar, `verifyToken()` ile
   JWT imzasını doğrular.
3. Token süresi 3 dakikanın altına düştüğünde `refreshAccessToken()` ile arka planda yenilenir
   (10 saniyelik interval).
4. Çıkışta cookie temizlenir ve platform logout sayfasına yönlenir.

Token cookie'leri (`ENCRYPTED_TOKEN_CHUNK_*`) `NEXT_PUBLIC_SUB_DOMAIN` üzerine yazıldığı için aynı
subdomain'deki Dakika uygulamalarıyla **oturum paylaşılır**; `ENCRYPTION_KEY`/`IV` değerleri aynı olmalıdır.

Sunucu tarafı istekler için iki yol var:

- `src/utils/authorized-request.ts` (`'use server'`) + `src/utils/api-request.ts` — server action tarzı çağrılar.
- `src/app/api/**` route handler'ları — `src/app/api/_lib/proxy.ts` token'ı ekleyip backend'e forward eder,
  böylece token tarayıcıya hiç inmez. Örnek: `src/app/api/knowledge/[...path]/route.ts`
  (`/api/knowledge/foo` → `${BACKEND_API_URL}/foo`).

## Yetkilendirme

`src/contexts/module-context` modül yetkilerini tutar. `NEXT_PUBLIC_MODULE_PERMISSIONS_ENABLED=false`
(varsayılan) iken backend'e sorulmadan tüm modüller açık kabul edilir; `true` yapıldığında
`GET {BACKEND_API_URL}/modules/permission` yanıtı kullanılır.

- Sayfa bazlı koruma: `withModulePermission(Page, 'knowledge')` — yetki yoksa `/errors/not-authorized`.
- Menü, `src/components/app-shell/module-registry.ts` içindeki modül tanımından üretilir; yetkisi
  olmayan modül/menü öğesi sidebar'da görünmez.
- Yeni modül eklerken: `ModulePermissionResponse` alanı → `MODULE_PRIORITY` → `moduleNavConfig` → route.

## Dizin yapısı

```
src/
├── app/
│   ├── (authenticatedPages)/     # SSO arkasındaki sayfalar (shell içinde)
│   │   ├── layout.tsx            # AuthProvider > ModulePermission > i18n > Shell
│   │   └── knowledge/            # örnek modül sayfası
│   ├── api/
│   │   ├── _lib/                 # route handler auth + proxy yardımcıları
│   │   ├── health/               # k8s probe
│   │   └── knowledge/[...path]/  # backend proxy örneği
│   ├── errors/not-authorized/
│   ├── layout.tsx                # tema, i18n, toaster, env doğrulama
│   └── page.tsx                  # ilk yetkili modüle yönlendirir
├── components/
│   ├── app-shell/                # ui-shell-next entegrasyonu + nav registry
│   ├── errors/, layout/          # unauthorized, topbar aksiyonları, popover'lar
│   └── logo.tsx, toaster.tsx
├── contexts/{auth-context,module-context}
├── hocs/with-module-permission.tsx
├── hooks/                        # use-auth-context, use-popover, use-media-query …
├── i18n/                         # i18next kurulumu + locales/{tr,en}.json
├── provider/                     # tema + MUI date-picker lokalizasyonu
├── styles/theme/                 # renk şemaları, tipografi, component override'ları
└── utils/                        # SSO config, authorized request, logger, settings
```

## Komutlar

```bash
npm run run:local     # dev server (.env.local)
npm run run:dev       # dev server (.env.dev)
npm run build:test    # test ortamı build'i
npm run lint          # eslint
npm run typecheck     # tsc --noEmit
npm run prettier      # format
```

`npm audit` için public registry gerekir:

```bash
npm audit --registry=https://registry.npmjs.org fix
```
# knowledge-ui
