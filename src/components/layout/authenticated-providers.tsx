'use client';

import * as React from 'react';

import { KnowledgeShell } from 'src/components/app-shell/knowledge-shell';

interface AuthenticatedProvidersProps {
  children: React.ReactNode;
}

/**
 * Single place to mount module-level providers (data, feature contexts) around
 * the app shell once modules start landing.
 */
export function AuthenticatedProviders({ children }: AuthenticatedProvidersProps): React.JSX.Element {
  return <KnowledgeShell>{children}</KnowledgeShell>;
}
