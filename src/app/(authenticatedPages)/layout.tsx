import * as React from 'react';

import { AuthenticatedProviders } from 'src/components/layout/authenticated-providers';
import { AuthProvider } from 'src/contexts/auth-context';
import { ModulePermissionProvider } from 'src/contexts/module-context';
import { InternationalizationContext } from 'src/i18n/internationalization-context';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps): React.JSX.Element {
  return (
    <AuthProvider>
      <ModulePermissionProvider>
        <InternationalizationContext>
          <AuthenticatedProviders>{children}</AuthenticatedProviders>
        </InternationalizationContext>
      </ModulePermissionProvider>
    </AuthProvider>
  );
}
