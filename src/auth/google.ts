import { authClient } from './auth-client';
import { getGoogleCallbackURLs } from './redirects';

export async function startGoogleSignIn(returnTo: string) {
  const urls = getGoogleCallbackURLs(returnTo);
  return authClient.signIn.social({
    provider: 'google',
    ...urls,
  });
}
