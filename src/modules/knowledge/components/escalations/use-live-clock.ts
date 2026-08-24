'use client';

import { useEffect, useState } from 'react';

/**
 * Dakikada bir kendini tazeleyen zaman kaynağı.
 *
 * Havuz bir nöbet ekranı: süreler ekran açık kaldıkça işlemeye devam etmeli,
 * yoksa "3 saat bekliyor" yazısı sekme açık kaldığı sürece yanlış kalır.
 * Prototip bunu DOM'u elle yamayarak yapıyordu; burada tek bir state yeterli.
 *
 * Sekme arkaya alındığında tarayıcı zamanlayıcıyı kısıyor, o yüzden sekmeye
 * dönüldüğünde de bir kez tazelenir.
 */
export function useLiveClock(intervalMs = 60000): number {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const tick = () => setNowMs(Date.now());
    const timer = setInterval(tick, intervalMs);
    const onVisibility = () => {
      if (!document.hidden) {
        tick();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [intervalMs]);

  return nowMs;
}
