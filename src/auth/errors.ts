type AuthErrorLike = {
  code?: string;
  message?: string;
  status?: number;
  statusText?: string;
};

const asAuthError = (error: unknown): AuthErrorLike =>
  typeof error === 'object' && error !== null ? (error as AuthErrorLike) : {};

export const SIGNUP_NOT_ALLOWED_CODE = 'SIGNUP_NOT_ALLOWED';
export const BETA_SIGNUP_MESSAGE =
  'Website is still in beta, registered user only';

export const GOOGLE_AUTH_ERROR =
  'Google sign-in was canceled or could not be completed. Please try again.';

const asComparableErrorText = (value: string): string =>
  value.replace(/_/g, ' ').trim().toLowerCase();

export function isSignupNotAllowedError(
  error: Pick<AuthErrorLike, 'code' | 'message'> | string | null | undefined,
): boolean {
  if (!error) return false;
  if (typeof error === 'string') {
    const comparable = asComparableErrorText(error);
    return (
      comparable === SIGNUP_NOT_ALLOWED_CODE.toLowerCase() ||
      comparable === BETA_SIGNUP_MESSAGE.toLowerCase()
    );
  }
  return (
    error.code === SIGNUP_NOT_ALLOWED_CODE ||
    isSignupNotAllowedError(error.message)
  );
}

export function getAuthCallbackError(
  searchParams: Pick<URLSearchParams, 'getAll' | 'has'>,
): string | null {
  if (!searchParams.has('error')) return null;
  const values = [
    ...searchParams.getAll('error'),
    ...searchParams.getAll('error_description'),
  ];
  if (values.some((value) => isSignupNotAllowedError(value))) {
    return BETA_SIGNUP_MESSAGE;
  }
  return GOOGLE_AUTH_ERROR;
}

export function getSignInError(error: unknown): string {
  const details = asAuthError(error);
  if (isSignupNotAllowedError(details)) {
    return BETA_SIGNUP_MESSAGE;
  }
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
  if (isSignupNotAllowedError(details)) {
    return BETA_SIGNUP_MESSAGE;
  }
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
