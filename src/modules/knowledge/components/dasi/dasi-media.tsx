'use client';

import * as React from 'react';
import { useEffect, useRef, useState } from 'react';

import { DASI_ASSETS, type DasiState } from 'src/modules/knowledge/constants';

/**
 * Dasi'nin görsel katmanı — prototipin `dasi.js → medyaYaz` karşılığı.
 *
 * İki kademeli: bir state'in videosu varsa oynatılır, yoksa statik görsel basılır.
 * Video 404 verirse ya da kullanıcı hareket azaltma istiyorsa otomatik olarak
 * görsele düşülür — state mantığı hiçbir hâlde bozulmaz.
 */

/* ── Siyah zemin ayırma ───────────────────────────────────────────────────
   Dasi videoları arka planı kaldırılmış hâlde geliyor ama MP4/H.264 alpha
   kanalı taşımadığı için zemin SİYAH kaydediliyor. Düz bir luma eşiği burada
   işe yaramaz: Dasi'nin yüz ekranı da siyah, eşikle silinince yüzünde delik
   açılıyor.

   Çözüm kenarlardan taşma dolgusu: yalnızca kareye kenardan bağlı siyah bölge
   saydamlaştırılır. Yüz ekranı parlak kabuğun içine kapandığı için kenara bağlı
   değil, dolayısıyla korunur. Kare kare işlem gerektirdiği için <video> yerine
   <canvas> basılır; video gizli tutulup kaynak olarak kullanılır. */

const BLACK_THRESHOLD = 42;

/** Bir kez açılamayan video yolu bir daha denenmez. */
const brokenVideos = new Set<string>();

function separateBlackBackdrop(ctx: CanvasRenderingContext2D, size: number): void {
  const image = ctx.getImageData(0, 0, size, size);
  const data = image.data;
  const seen = new Uint8Array(size * size);
  const queue: number[] = [];

  // Dört kenarın tamamı tohum olarak eklenir.
  for (let i = 0; i < size; i++) {
    queue.push(i, (size - 1) * size + i, i * size, i * size + size - 1);
  }

  while (queue.length) {
    const pixel = queue.pop() as number;
    if (seen[pixel]) {
      continue;
    }
    const offset = pixel * 4;
    const luma = 0.299 * data[offset] + 0.587 * data[offset + 1] + 0.114 * data[offset + 2];
    if (luma >= BLACK_THRESHOLD) {
      continue;
    }
    seen[pixel] = 1;

    const x = pixel % size;
    const y = (pixel - x) / size;
    if (x > 0) queue.push(pixel - 1);
    if (x < size - 1) queue.push(pixel + 1);
    if (y > 0) queue.push(pixel - size);
    if (y < size - 1) queue.push(pixel + size);
  }

  for (let pixel = 0; pixel < size * size; pixel++) {
    if (seen[pixel]) {
      data[pixel * 4 + 3] = 0;
    }
  }

  ctx.putImageData(image, 0, 0);
}

/** Hareket azaltma tercihi — 07 §4. Oturum ortasında değişebildiği için dinlenir. */
function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!query) {
      return;
    }
    setReduced(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener('change', onChange);

    return () => query.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

/* ── Bir tur bekleme ──────────────────────────────────────────────────────
   Akışlar "animasyon bir tam tur atsın" diye beklerken sabit süre yazmak
   kırılgandı: klipler yeniden üretildikçe uzuyor ve animasyon yarıda kesilip
   statik görsele dönüyordu. Süre videonun kendisinden okunur ve önbelleğe
   alınır; video yoksa `minMs` kadar beklenir. */

const durationCache = new Map<string, number>();

export async function waitOneVideoCycle(state: DasiState, { minMs = 900 }: { minMs?: number } = {}): Promise<void> {
  const src = DASI_ASSETS[state].video;

  const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

  if (!src || brokenVideos.has(src)) {
    return wait(minMs);
  }

  let duration = durationCache.get(src);

  if (duration === undefined) {
    duration = await new Promise<number>(resolve => {
      const probe = document.createElement('video');
      probe.preload = 'metadata';
      probe.muted = true;
      probe.src = src;
      const done = (value: number) => resolve(value);
      probe.addEventListener('loadedmetadata', () => done(probe.duration || 0), { once: true });
      probe.addEventListener('error', () => done(0), { once: true });
      // Metadata hiç gelmezse takılı kalmayalım.
      setTimeout(() => done(0), 2500);
    });
    durationCache.set(src, duration);
  }

  // +150 ms: son kare ekranda bir an dursun, geçiş ani olmasın.
  return wait(Math.max(minMs, duration * 1000 + 150));
}

/* ── Bileşen ──────────────────────────────────────────────────────────── */

export interface DasiMediaProps {
  state: DasiState;
  /**
   * İşleme çözünürlüğü. Taşma dolgusu kare kare çalıştığı için maliyet piksel
   * sayısıyla doğru orantılı: 56 px'lik sohbet avatarına 320² dolgu çalıştırmak
   * her karede boşa giden CPU demek.
   */
  resolution?: number;
  /**
   * Bu yüzey bu state'te video oynatacak mı. Sohbet ekranında hero yalnızca
   * Dasi'nin "orada olma" hâlini temsil ediyor; işlem animasyonları sohbet
   * akışındaki avatarda gösteriliyor (14 §3).
   */
  playVideo?: boolean;
  className?: string;
}

export function DasiMedia({ state, resolution = 256, playVideo = true, className }: DasiMediaProps): React.JSX.Element {
  const asset = DASI_ASSETS[state];
  const reducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  /** Tek seferlik animasyon bitti ya da video açılamadı → statik görsel. */
  const [showStill, setShowStill] = useState(false);

  const videoSrc = asset.video;
  const canPlay =
    Boolean(videoSrc) && playVideo && !reducedMotion && !showStill && !brokenVideos.has(videoSrc as string);

  useEffect(() => {
    // Yeni bir kaynak geldiğinde statik görsele düşme kararı sıfırlanır.
    setShowStill(false);
  }, [videoSrc, playVideo]);

  useEffect(() => {
    if (!canPlay || !videoSrc) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const size = resolution;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      return;
    }

    const video = document.createElement('video');
    video.src = videoSrc;
    video.loop = Boolean(asset.loop);
    video.muted = true; // autoplay'in ön koşulu
    video.autoplay = true;
    video.playsInline = true; // iOS'ta tam ekrana kaçmasın
    video.preload = 'auto';

    let running = true;

    const onError = () => {
      brokenVideos.add(videoSrc);
      console.warn(`[Dasi] Video açılamadı, statik görsele dönülüyor: ${videoSrc}`);
      setShowStill(true);
    };

    // Tek seferlik animasyon bitince nötr görsele dönülür. Son karede donup
    // kalmak Dasi'yi o ifadede kilitli bırakıyordu; sohbet ilerledikçe eski bir
    // tepkinin ekranda kalması yanlış sinyal veriyor.
    const onEnded = () => setShowStill(true);

    const draw = () => {
      if (!running) {
        return;
      }
      if (video.readyState >= 2) {
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(video, 0, 0, size, size);
        separateBlackBackdrop(ctx, size);
      }
      // requestVideoFrameCallback varsa yalnızca gerçek karelerde çalışır.
      if ('requestVideoFrameCallback' in video) {
        (
          video as HTMLVideoElement & { requestVideoFrameCallback: (cb: () => void) => number }
        ).requestVideoFrameCallback(draw);
      } else {
        requestAnimationFrame(draw);
      }
    };

    const onLoadedData = () => {
      // autoplay özniteliği bazı tarayıcılarda tek başına yetmiyor. Reddedilirse
      // ilk kare çizilir, kırık bir şey görünmez — bu yüzden hata yutuluyor.
      video.play?.().catch(() => {});
      draw();
    };

    video.addEventListener('error', onError, { once: true });
    video.addEventListener('loadeddata', onLoadedData, { once: true });
    if (!asset.loop) {
      video.addEventListener('ended', onEnded, { once: true });
    }
    video.load();

    return () => {
      running = false;
      video.pause();
      video.removeEventListener('error', onError);
      video.removeEventListener('loadeddata', onLoadedData);
      video.removeEventListener('ended', onEnded);
      video.src = '';
    };
    // `state` bilinçli olarak dışarıda: aynı videoyu paylaşan state'ler arasında
    // geçerken (idle→welcome→listening) loop baştan başlamasın.
  }, [asset.loop, canPlay, resolution, videoSrc]);

  const label = `Dasi — ${state}`;

  const mediaClasses = ['block h-full w-full object-contain', className ?? ''].filter(Boolean).join(' ');

  if (!canPlay) {
    return (
      <img
        alt={label}
        className={mediaClasses}
        src={asset.image}
      />
    );
  }

  return (
    <canvas
      aria-label={label}
      className={mediaClasses}
      ref={canvasRef}
      role="img"
    />
  );
}
