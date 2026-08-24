'use client';

import * as React from 'react';

import { KnowledgeShell } from 'src/components/app-shell/knowledge-shell';
import { KnowledgeRoleProvider } from 'src/modules/knowledge/contexts/role-context';

interface AuthenticatedProvidersProps {
  children: React.ReactNode;
}

/**
 * Single place to mount module-level providers (data, feature contexts) around
 * the app shell once modules start landing.
 *
 * Rol sağlayıcısı kabuğun ÜSTÜNDE duruyor: sidebar maddeleri rol filtresinden
 * geçtiği için kabuk rolü bilmek zorunda.
 */
export function AuthenticatedProviders({ children }: AuthenticatedProvidersProps): React.JSX.Element {
  return (
    <KnowledgeRoleProvider>
      <KnowledgeShell>{children}</KnowledgeShell>
    </KnowledgeRoleProvider>
  );
}
