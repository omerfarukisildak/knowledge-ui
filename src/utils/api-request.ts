'use client';

import { Logout } from 'src/contexts/auth-context/utils';

import authorizedRequest from './authorized-request';

const apiRequest = async (
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any,
  useCommonBackend: boolean = false
) => {
  const resp = await authorizedRequest(path, method, payload, useCommonBackend);
  if (resp.logout) {
    await Logout();
    throw new Error('User is not authorized');
  }
  return resp.data;
};

export default apiRequest;
