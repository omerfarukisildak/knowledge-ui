'use client';

import React, { ReactNode, createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { Token } from '@dakika/auth/dist/src/types';
import crypto from 'crypto-js';
import { v4 as uuid_v4 } from 'uuid';

import { LoadingNav } from 'src/components/layout/vertical/loading-nav';
import { paths } from 'src/paths';

import { getAuthInfo, login, redirectToLogin, refreshToken } from './services';
import { Logout, isTokenExpired } from './utils';

const _localStorage = typeof localStorage !== 'undefined' ? localStorage : undefined;

export const getUUID = () => {
  let encryptedUUID = _localStorage?.getItem('verifyToken');
  const generatedUUID = _localStorage?.getItem('generateUUID') || uuid_v4();
  if (!encryptedUUID) {
    _localStorage?.setItem('generateUUID', generatedUUID);

    // Create an SHA-256 hash
    const hashedUUID = crypto.SHA256(generatedUUID).toString();

    // Encode the hash in base64
    const encodedUUID = btoa(hashedUUID);

    _localStorage?.setItem('verifyToken', encodedUUID);
    encryptedUUID = encodedUUID;
  }
  return [generatedUUID, encryptedUUID];
};

export interface AuthContextType {
  token: Token | null;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  token: null,
  signOut: async () => Promise.resolve()
});

export const AuthConsumer = AuthContext.Consumer;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [generatedUUID, encryptedUUID] = getUUID();
  const urlCode = searchParams.get('code');

  const [token, setToken] = useState<Token | null>(null);
  const isRefreshingRef = useRef(false);
  /** Authorization code yalnızca bir kez token'a çevrilir (bkz. login effect'i). */
  const loginAttemptedRef = useRef(false);

  const signOut = useCallback(async () => {
    try {
      await Logout();
    } catch (e) {
      console.error('Error logging out', e);
    }
  }, []);

  const refreshTokenIfNeeded = useCallback(
    async (token: Token | null): Promise<boolean> => {
      if (isTokenExpired(token) && !isRefreshingRef.current) {
        isRefreshingRef.current = true;
        try {
          const { decoded } = await refreshToken();
          if (!decoded) {
            console.error('Error refreshing token');
            await signOut();
            return false;
          }
          setToken(decoded);
          isRefreshingRef.current = false;
        } catch (error) {
          console.error('Exception refreshing token', error);
          await signOut();
          return false;
        }
        return true;
      }
      return false;
    },
    [signOut]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      refreshTokenIfNeeded(token).then();
    }, 10e3);
    return () => {
      clearInterval(interval);
    };
  }, [token, refreshTokenIfNeeded]);

  useEffect(() => {
    /**
     * OAuth authorization code TEK KULLANIMLIKTIR. Bu effect birden fazla kez
     * koşarsa (React 18 dev modunda effect'ler iki kez çalışır; ayrıca
     * `useSearchParams()` her render'da yeni referans döndürebildiği için
     * bağımlılık listesi de yeniden tetiklenir) ikinci denemede SSO
     * `invalid_grant` döner. O hata `login()` içindeki catch'e düşer ve
     * `clearTokenCookie()` çağrılarak İLK denemenin yazdığı geçerli token
     * silinir — giriş hiç tamamlanamaz. Bu yüzden deneme bir kezle sınırlanır.
     */
    if (urlCode && !loginAttemptedRef.current) {
      loginAttemptedRef.current = true;
      login(generatedUUID, urlCode)
        .then(async ({ token }) => {
          if (token) {
            setToken(token);
            const newSearchParams = new URLSearchParams(Array.from(searchParams.entries()));
            newSearchParams.delete('code');
            const searchParamText = newSearchParams.size > 0 ? `?${newSearchParams.toString()}` : '';
            router.replace(process.env.NEXT_PUBLIC_REDIRECT_URL + paths.index + searchParamText);
          } else {
            console.error('JWT Token Exception');
            signOut().then();
          }
        })
        .catch(error => {
          console.error('Error logging in', error);
          signOut().then();
        });
    }
    return;
  }, [urlCode, signOut, generatedUUID, router, searchParams]);

  useEffect(() => {
    if (urlCode) {
      return;
    }
    if (token) {
      refreshTokenIfNeeded(token).then();
      return;
    }
    getAuthInfo().then(token => {
      if (!token) {
        redirectToLogin(encryptedUUID).then();
      } else {
        refreshTokenIfNeeded(token).then(refreshed => {
          if (!refreshed) {
            setToken(token);
          }
        });
      }
    });
  }, [token, encryptedUUID, urlCode, refreshTokenIfNeeded]);

  const authContextValue = useMemo(
    () => ({
      token,
      signOut
    }),
    [signOut, token]
  );
  const memoizedChildren = useMemo(() => children, [children]);

  if (!token || urlCode) {
    return <LoadingNav />;
  }

  return <AuthContext.Provider value={authContextValue}>{memoizedChildren}</AuthContext.Provider>;
};
