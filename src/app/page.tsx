import { redirect } from 'next/navigation';

import { getFirstAllowedModuleEntry } from 'src/components/app-shell/module-registry';
import { getModulePermissions } from 'src/contexts/module-context/services';
import { paths } from 'src/paths';

export const dynamic = 'force-dynamic';

export default async function Page({
  searchParams
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const entryPath = await getInitialEntryPath();
  const redirectPath = new URL(entryPath, process.env.NEXT_PUBLIC_REDIRECT_URL);

  if (searchParams) {
    for (const key in searchParams) {
      const value = searchParams[key];
      if (Array.isArray(value)) {
        value.forEach(item => {
          redirectPath.searchParams.append(key, item);
        });
      } else if (value) {
        redirectPath.searchParams.append(key, value);
      }
    }
  }

  redirect(redirectPath.toString());
}

async function getInitialEntryPath(): Promise<string> {
  try {
    const permissions = await getModulePermissions();
    return getFirstAllowedModuleEntry(permissions) ?? paths.notAuthorized;
  } catch {
    return paths.knowledge;
  }
}
