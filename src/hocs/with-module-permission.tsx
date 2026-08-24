import { useLayoutEffect } from 'react';

import { redirect } from 'next/navigation';

import { ModuleKey } from 'src/contexts/module-context';
import { useModuleContext } from 'src/hooks/use-module-context';
import { paths } from 'src/paths';

// MUST BE USED INSIDE MODULE PERMISSION PROVIDER
function withModulePermission<P extends object>(WrappedComponent: React.ComponentType<P>, module: ModuleKey) {
  const WithModulePermission: React.FC<P> = ({ ...props }) => {
    const { hasModulePermission, isFetched } = useModuleContext();

    useLayoutEffect(() => {
      if (!isFetched) {
        return;
      }
      if (!hasModulePermission(module)) {
        redirect(paths.notAuthorized);
      }
    }, [hasModulePermission, isFetched]);

    if (!isFetched) {
      return null;
    }

    return <WrappedComponent {...(props as P)} />;
  };

  return WithModulePermission;
}

export default withModulePermission;
