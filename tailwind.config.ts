import type { Config } from 'tailwindcss';

/**
 * Tailwind, MUI temasının ÜSTÜNE biner — renk/gölge/yuvarlaklık değerleri
 * doğrudan MUI'nin CSS değişkenlerinden okunur. Böylece tek renk kaynağı tema
 * dosyaları olarak kalır ve koyu tema kendiliğinden çalışır (MUI değişkenleri
 * `data-mui-color-scheme` değiştiğinde zaten güncelleniyor).
 *
 * `mainChannel` biçimindeki değişkenler "R G B" döndüğü için `<alpha-value>` ile
 * birlikte kullanılabiliyor: `bg-primary/15` gibi opaklık sözdizimi çalışır.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  /**
   * MUI'nin `CssBaseline`'ı zaten bir reset uyguluyor; Tailwind preflight ikinci
   * bir reset koyup MUI tipografisini ve form elemanlarını bozuyor.
   */
  corePlugins: { preflight: false },
  /**
   * Utility'ler tek bir kök seçiciye sarılır (`#app-root .flex { … }`). Bu,
   * specificity'yi MUI'nin emotion sınıflarının üstüne çıkarır; `!important`
   * serpmeye gerek kalmaz. Kök id `src/app/layout.tsx` içindeki `<body>`'de.
   */
  important: '#app-root',
  /** Koyu tema anahtarı MUI ile aynı: `data-mui-color-scheme="dark"`. */
  darkMode: ['selector', '[data-mui-color-scheme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Yüzeyler ve metin
        canvas: 'var(--mui-palette-background-default)',
        surface: 'var(--mui-palette-background-paper)',
        'surface-1': 'var(--mui-palette-background-level1)',
        'surface-2': 'var(--mui-palette-background-level2)',
        border: 'rgb(var(--mui-palette-dividerChannel) / <alpha-value>)',
        fg: 'rgb(var(--mui-palette-text-primaryChannel) / <alpha-value>)',
        'fg-muted': 'rgb(var(--mui-palette-text-secondaryChannel) / <alpha-value>)',
        'fg-subtle': 'var(--mui-palette-text-disabled)',
        // Marka
        primary: {
          DEFAULT: 'rgb(var(--mui-palette-primary-mainChannel) / <alpha-value>)',
          dark: 'var(--mui-palette-primary-dark)',
          light: 'var(--mui-palette-primary-light)',
          contrast: 'var(--mui-palette-primary-contrastText)',
          /**
           * Yumuşak zeminler üzerinde metin/ikon için. Ana ton kendi %15'lik
           * zemininde 2–3:1'de kalıyordu; 700 tonu açık temada 4.5:1'i geçiyor.
           * Koyu temada bunun karşılığı `light` tonudur (bkz. `dark:text-*-light`).
           */
          strong: 'var(--mui-palette-primary-700)'
        },
        // Anlamsal durum renkleri — rozetler ve balon tonları
        success: {
          DEFAULT: 'rgb(var(--mui-palette-success-mainChannel) / <alpha-value>)',
          strong: 'var(--mui-palette-success-700)',
          light: 'var(--mui-palette-success-light)',
          /** Temanın kendi kararı: açıkta beyaz, koyuda siyah. */
          contrast: 'var(--mui-palette-success-contrastText)'
        },
        info: {
          DEFAULT: 'rgb(var(--mui-palette-info-mainChannel) / <alpha-value>)',
          strong: 'var(--mui-palette-info-700)',
          light: 'var(--mui-palette-info-light)'
        },
        warning: {
          DEFAULT: 'rgb(var(--mui-palette-warning-mainChannel) / <alpha-value>)',
          strong: 'var(--mui-palette-warning-700)',
          light: 'var(--mui-palette-warning-light)',
          contrast: 'var(--mui-palette-warning-contrastText)'
        },
        error: {
          DEFAULT: 'rgb(var(--mui-palette-error-mainChannel) / <alpha-value>)',
          strong: 'var(--mui-palette-error-700)',
          light: 'var(--mui-palette-error-light)'
        },
        /**
         * Derin Araştırma moru — MUI paletinde karşılığı yok, prototipin kendi
         * tonu. Değerler `global.css` içindeki knowledge token'larından gelir ki
         * koyu tema karşılığı tek yerde dursun.
         */
        research: {
          DEFAULT: 'var(--kb-research-fg)',
          soft: 'var(--kb-research-bg)'
        },
        /** Karşılama ekranındaki parıltı noktaları — her iki temada görünür olmalı. */
        star: 'var(--kb-star)',
        /**
         * Kabuk paleti. Sidebar her iki temada koyu kalıyor (uygulamanın kimliği),
         * bu yüzden MUI paletinden değil kendi token'larından besleniyor.
         */
        sidebar: {
          DEFAULT: 'var(--kb-sidebar-bg)',
          hover: 'var(--kb-sidebar-hover)',
          active: 'var(--kb-sidebar-active)',
          edge: 'var(--kb-sidebar-edge)',
          divider: 'var(--kb-sidebar-divider)',
          avatar: 'var(--kb-sidebar-avatar)',
          fg: 'var(--kb-on-sidebar)',
          'fg-soft': 'var(--kb-on-sidebar-soft)',
          'fg-mute': 'var(--kb-on-sidebar-mute)'
        },
        online: 'var(--kb-online)',
        badge: { DEFAULT: 'var(--kb-badge)', alert: 'var(--kb-badge-alert)' }
      },
      borderRadius: {
        bubble: '16px',
        composer: '22px'
      },
      spacing: {
        sidebar: 'var(--kb-sidebar-w)',
        topbar: 'var(--kb-topbar-h)'
      },
      boxShadow: {
        card: 'var(--mui-shadows-1)',
        lifted: 'var(--mui-shadows-8)'
      },
      keyframes: {
        'kb-star': {
          '0%, 100%': { opacity: '0.25', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.35)' }
        },
        'kb-pulse': {
          '0%, 100%': { opacity: '0.35', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' }
        },
        'kb-typing': {
          '0%, 100%': { opacity: '0.3', transform: 'translateY(0)' },
          '50%': { opacity: '1', transform: 'translateY(-3px)' }
        },
        'kb-caret': { '50%': { opacity: '0' } }
      },
      animation: {
        'kb-star': 'kb-star 3.4s ease-in-out infinite',
        'kb-pulse': 'kb-pulse 1.3s ease-in-out infinite',
        'kb-typing': 'kb-typing 1.2s ease-in-out infinite',
        'kb-caret': 'kb-caret 0.7s steps(1) infinite'
      }
    }
  }
};

export default config;
