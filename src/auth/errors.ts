type AuthErrorLike = {
  code?: string;
  message?: string;
  status?: number;
  statusText?: string;
};

const asAuthError = (error: unknown): AuthErrorLike =>
  typeof error === 'object' && error !== null ? (error as AuthErrorLike) : {};

export function getSignInError(error: unknown): string {
  const details = asAuthError(error);
  if (
    details.status === 401 ||
    details.code === 'INVALID_EMAIL_OR_PASSWORD' ||
    details.code === 'INVALID_PASSWORD'
  ) {
    return 'Email or password is incorrect.';
  }
  return 'We could not sign you in. Please try again.';
}

export function getSignUpError(error: unknown): string {
  const details = asAuthError(error);
  if (
    details.status === 422 ||
    details.code === 'USER_ALREADY_EXISTS' ||
    details.code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL'
  ) {
    return 'An account with this email already exists.';
  }
  if (details.status === 400) {
    return 'Please check your details and try again.';
  }
  return 'We could not create your nook. Please try again.';
}

export const GOOGLE_AUTH_ERROR =
  'Google sign-in was canceled or could not be completed. Please try again.';
