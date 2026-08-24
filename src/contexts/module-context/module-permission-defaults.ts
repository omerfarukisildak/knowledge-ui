/**
 * Plain module (no `'use server'`) so constants can be shared between the client
 * context and the server action — a `'use server'` file may only export async functions.
 */
export interface ModulePermissionResponse {
  knowledge: boolean;
}

export type ModuleKey = keyof ModulePermissionResponse;

export const ALL_MODULES_ALLOWED: ModulePermissionResponse = {
  knowledge: true
};

export const NO_MODULES_ALLOWED: ModulePermissionResponse = {
  knowledge: false
};
