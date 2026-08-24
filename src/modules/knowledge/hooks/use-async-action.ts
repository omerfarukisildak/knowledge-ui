'use client';

import { useCallback, useRef, useState } from 'react';

import { toast } from 'sonner';

/**
 * Prototipteki `guvenli` + `butonlaCalis` ikilisinin karşılığı.
 *
 * Tek işi var: bir async işi çalıştırırken bekleme durumunu tutmak, hatayı
 * kullanıcıya anlaşılır bir bildirimle göstermek ve `null` döndürerek çağıranın
 * akışı sessizce kesmesine izin vermek. Aynı iş bitmeden ikinci kez tetiklenmez.
 */
export function useAsyncAction(): {
  isPending: boolean;
  run: <T>(task: () => Promise<T>, options?: { message?: string }) => Promise<T | null>;
} {
  const [isPending, setIsPending] = useState(false);
  const inFlight = useRef(false);

  const run = useCallback(async <T>(task: () => Promise<T>, options?: { message?: string }): Promise<T | null> => {
    if (inFlight.current) {
      return null;
    }
    inFlight.current = true;
    setIsPending(true);

    try {
      return await task();
    } catch (error) {
      const detail = error instanceof Error ? error.message : null;
      toast.error(options?.message ?? 'İşlem tamamlanamadı.', detail ? { description: detail } : undefined);
      console.error('[knowledge] Async işlem başarısız.', error);

      return null;
    } finally {
      inFlight.current = false;
      setIsPending(false);
    }
  }, []);

  return { isPending, run };
}
