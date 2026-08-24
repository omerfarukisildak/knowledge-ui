'use client';

import { Token } from '@dakika/auth/dist/src/types';

import { logout } from './services';

const _localStorage = typeof localStorage !== 'undefined' ? localStorage : undefined;

export const isTokenExpired = (token: Token | null) => {
  if (token?.exp) {
    const timeToExpireInSeconds = token.exp - Math.floor(Date.now() / 1000);
    return timeToExpireInSeconds < 180; // Refresh token if it expires in less than 3 minutes
  }
  return false;
};

export const Logout = async () => {
  try {
    await logout();
  } catch (ex) {
    console.error('api logout failed: ' + ex.message);
  } finally {
    const themeMode = _localStorage?.getItem('mui-mode');

    _localStorage?.clear();

    if (themeMode) {
      _localStorage?.setItem('mui-mode', themeMode);
    }

    const logoutURL = `${process.env.NEXT_PUBLIC_DAKIKA_URL}/payroll/logout.xhtml`;
    window.location.href = logoutURL;
  }
};
