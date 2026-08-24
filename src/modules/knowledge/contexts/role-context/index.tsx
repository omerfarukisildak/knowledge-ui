'use client';

import * as React from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getCurrentUser } from 'src/modules/knowledge/api';
import { isReadOnlyFor } from 'src/modules/knowledge/navigation';
import type { KnowledgeRole, KnowledgeUser } from 'src/modules/knowledge/types';

/**
 * Bilgi Bankası rol kapısı — prototipin `app-shell.js` içindeki
 * `mevcutKullanici` / `rolVar` / `saltOkurMu` üçlüsünün karşılığı.
 *
 * K4: rol kaynağı şimdilik `getCurrentUser()` (mock adaptöründe tohum veri,
 * http adaptöründe `GET /me`). Backend claim/endpoint netleştiğinde yalnızca o
 * fonksiyon değişir; buradaki ve ekranlardaki hiçbir kod değişmez.
 *
 * Modül-bazlı yetki (`withModulePermission`) bunun ÜSTÜNDE ayrı bir katman:
 * o modüle girip girememeyi, bu ise modül içinde ne yapabileceğini belirler.
 */

export interface KnowledgeRoleContextValue {
  user: KnowledgeUser | null;
  role: KnowledgeRole | null;
  isFetched: boolean;
  /** Verilen rollerden birine sahip mi (prototip: `rolVar`). */
  hasRole: (...roles: KnowledgeRole[]) => boolean;
  /** Bu ekranda aksiyon alabilir mi (prototip: `saltOkurMu`). */
  isReadOnly: (href: string) => boolean;
}

const KnowledgeRoleContext = createContext<KnowledgeRoleContextValue>({
  user: null,
  role: null,
  isFetched: false,
  hasRole: () => false,
  isReadOnly: () => true
});

export function KnowledgeRoleProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [user, setUser] = useState<KnowledgeUser | null>(null);
  const [isFetched, setIsFetched] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getCurrentUser()
      .then(current => {
        if (!cancelled) {
          setUser(current);
        }
      })
      .catch(error => {
        console.error('[knowledge] Kullanıcı rolü okunamadı.', error);
      })
      .finally(() => {
        if (!cancelled) {
          setIsFetched(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const role = user?.role ?? null;

  const hasRole = useCallback((...roles: KnowledgeRole[]) => (role ? roles.includes(role) : false), [role]);

  const isReadOnly = useCallback((href: string) => isReadOnlyFor(href, role), [role]);

  const value = useMemo<KnowledgeRoleContextValue>(
    () => ({ user, role, isFetched, hasRole, isReadOnly }),
    [hasRole, isFetched, isReadOnly, role, user]
  );

  return <KnowledgeRoleContext.Provider value={value}>{children}</KnowledgeRoleContext.Provider>;
}

export function useKnowledgeRole(): KnowledgeRoleContextValue {
  return useContext(KnowledgeRoleContext);
}
