import { createAuthClient } from 'better-auth/react';

const environment: unknown = import.meta.env;
const configuredApiURL =
  typeof environment === 'object' &&
  environment !== null &&
  'VITE_API_URL' in environment &&
  typeof environment.VITE_API_URL === 'string'
    ? environment.VITE_API_URL.trim()
    : '';
const apiURL = configuredApiURL || 'http://localhost:3000';

export const authClient = createAuthClient({
  baseURL: apiURL,
});

export const { signIn, signOut, signUp, useSession } = authClient;
