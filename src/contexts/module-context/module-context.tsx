'use client';

import React, { ReactNode, createContext, useCallback, useEffect, useMemo, useState } from 'react';

import { LoadingNav } from 'src/components/layout/vertical/loading-nav';
import { useAuthContext } from 'src/hooks/use-auth-context';

import { type ModuleKey, type ModulePermissionResponse, NO_MODULES_ALLOWED } from './module-permission-defaults';
import { getModulePermissions } from './services';

export interface ModuleContextType {
  permissions: ModulePermissionResponse;
  isFetched: boolean;
  hasModulePermission: (module: ModuleKey) => boolean;
}

export const ModuleContext = createContext<ModuleContextType>({
  permissions: NO_MODULES_ALLOWED,
  isFetched: false,
  hasModulePermission: () => false
});

export const ModulePermissionProvider = ({ children }: { children: ReactNode }) => {
  const { signOut } = useAuthContext();
  const [permissions, setPermissions] = useState<ModulePermissionResponse>(NO_MODULES_ALLOWED);
  const [isFetched, setIsFetched] = useState(false);

  const hasModulePermission = useCallback((module: ModuleKey) => permissions[module], [permissions]);

  useEffect(() => {
    let cancelled = false;

    getModulePermissions()
      .then(response => {
        if (cancelled) {
          return;
        }
        setPermissions(response);
        setIsFetched(true);
      })
      .catch(async () => {
        if (cancelled) {
          return;
        }
        await signOut();
      });

    return () => {
      cancelled = true;
    };
  }, [signOut]);

  const contextValue = useMemo(
    () => ({
      permissions,
      isFetched,
      hasModulePermission
    }),
    [hasModulePermission, isFetched, permissions]
  );

  if (!isFetched) {
    return <LoadingNav />;
  }

  return <ModuleContext.Provider value={contextValue}>{children}</ModuleContext.Provider>;
};
