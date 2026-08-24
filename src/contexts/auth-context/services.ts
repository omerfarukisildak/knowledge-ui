'use server';

import { redirect } from 'next/navigation';

import DakikaAuth from '@dakika/auth';
import { AuthenticationResponse, Token, UserInfoResponse } from '@dakika/auth/dist/src/types';
import axios, { AxiosRequestConfig } from 'axios';

import { getDakikaAuthConfig } from 'src/utils/get-dakika-auth-config';

const dakikaAuth = new DakikaAuth(getDakikaAuthConfig());

export const refreshToken = async () => dakikaAuth.refreshAccessToken();

export const redirectToLogin = async (verifyCode: string) => {
  redirect(
    `${process.env.NEXT_PUBLIC_OAUTH_URL}/oauth/authorize?response_type=code&client_id=${process.env.OAUTH_USERNAME}&scope=uid&code_challenge=${verifyCode}&code_challenge_method=S256&redirect_uri=${process.env.NEXT_PUBLIC_REDIRECT_URL}`
  );
};

const getSsoToken = async (
  urlCode: string,
  verifyCode: string
): Promise<{ access_token: string; refresh_token: string } | null> => {
  try {
    const { data: authData } = await axios.request<AuthenticationResponse>({
      method: 'post',
      data: {},
      url: `${process.env.NEXT_PUBLIC_OAUTH_URL}/oauth/token?grant_type=authorization_code&code=${urlCode}&redirect_uri=${process.env.NEXT_PUBLIC_REDIRECT_URL}&code_verifier=${verifyCode}&code_challenge_method=S256`,
      headers: {
        Authorization: `Basic ${await dakikaAuth.getSsoBasicToken()}`
      }
    } as AxiosRequestConfig);

    if (!authData.access_token) {
      console.error('Failed to fetch access token from sso server');
      return null;
    }

    const response = await axios.request<UserInfoResponse>({
      method: 'get',
      url: `${process.env.NEXT_PUBLIC_OAUTH_URL}/oauth/user`,
      headers: {
        Authorization: `Bearer ${authData.access_token}`
      }
    } as AxiosRequestConfig);

    if (
      !response.data.enabled ||
      !response.data.account_non_expired ||
      !response.data.account_non_locked ||
      !response.data.account_non_expired
    ) {
      console.error('User is not enabled or account is locked or expired');
      return null;
    }
    return { access_token: authData.access_token, refresh_token: authData.refresh_token };
  } catch (error) {
    console.error('Error while getting user authentication:', {
      data: error.response?.data,
      status: error.response?.status,
      host: error.response?.request?.host,
      path: error.response?.request?.path,
      headers: error.response?.request?.headers
    });
    return null;
  }
};

export const login = async (
  generateCode: string,
  urlCode: string
): Promise<{
  token: Token;
}> => {
  if (!urlCode || !generateCode) {
    throw new Error('code and verifyCode are required in the header.');
  }

  try {
    // Use getSsoToken service to get JWT token
    const jwtToken = await getSsoToken(urlCode, generateCode);
    if (!jwtToken) {
      throw new Error('Failed returning the JWT token from server');
    }

    const accessToken = jwtToken.access_token;
    const refreshToken = jwtToken.refresh_token;
    if (!accessToken || !refreshToken) {
      throw new Error('SSO failed to return access or refresh token');
    }
    const encryptedToken = dakikaAuth.encryptedTokens([accessToken, refreshToken]);
    await dakikaAuth.setTokenCookie(encryptedToken);

    const decrypted = await dakikaAuth.decryptToken(accessToken);
    if (!decrypted) {
      throw new Error('Failed to decrypt token');
    }

    const verifyTokenResponse = await dakikaAuth.verifyToken(decrypted);
    if (verifyTokenResponse.status === 'error' || !verifyTokenResponse.data) {
      throw new Error('Failed to verify token');
    }

    return {
      token: await dakikaAuth.decodedTokenToAuthentication(verifyTokenResponse.data)
    };
  } catch (error) {
    await dakikaAuth.clearTokenCookie();
    console.error('Error logging in:', error);
    throw new Error('An error occurred while getting the JWT token: ', error);
  }
};

export const logout = async () => {
  const token = await dakikaAuth.getAccessToken();
  await dakikaAuth.clearTokenCookie();

  if (!token) {
    return;
  }

  const logoutUrl = `${process.env.NEXT_PUBLIC_OAUTH_URL}/logout?redirect_uri=${process.env.NEXT_PUBLIC_REDIRECT_URL}`;
  try {
    const resp = await axios.get(logoutUrl, {
      headers: {
        // The schema below is correct, and it's not a bug. Check oauth2-sso
        accessToken: `${token}`
      }
    });
    console.info('Logging out in api: ', resp.status);
  } catch (error) {
    console.error('An error occurred while logging out:', error.response.data);
  }
};

export const getAuthInfo = async (): Promise<Token | null> => {
  const decryptedAccessToken = await dakikaAuth.getDecryptedAccessToken();
  if (!decryptedAccessToken) {
    return null;
  }

  const verifyTokenResponse = await dakikaAuth.verifyToken(decryptedAccessToken);
  if (verifyTokenResponse.status === 'error' || !verifyTokenResponse.data) {
    return null;
  }
  return dakikaAuth.decodedTokenToAuthentication(verifyTokenResponse.data);
};
