'use server';

import authorizedRequest from 'src/utils/authorized-request';

import { ALL_MODULES_ALLOWED, type ModulePermissionResponse } from './module-permission-defaults';

/**
 * Wire format from backend Jackson SNAKE_CASE property naming.
 * Extend together with {@link ModulePermissionResponse} as new modules land.
 */
interface ModulePermissionApiPayload {
  knowledge?: boolean;
}

/** Backend permission endpoint is opt-in so the app boots before it exists. */
const isPermissionCheckEnabled = () => process.env.NEXT_PUBLIC_MODULE_PERMISSIONS_ENABLED === 'true';

export const getModulePermissions = async (): Promise<ModulePermissionResponse> => {
  if (!isPermissionCheckEnabled()) {
    return ALL_MODULES_ALLOWED;
  }

  try {
    const response = await authorizedRequest('/modules/permission', 'GET', null);

    if (response.logout || !response.data) {
      throw new Error('getModulePermissions unauthorized');
    }

    const data = response.data as ModulePermissionApiPayload;

    return {
      knowledge: data.knowledge === true
    };
  } catch (error) {
    console.error('getModulePermissions error-', error);
    throw error;
  }
};
