export const MOCK_API_DELAY_MS = 400;

export const delay = (ms = MOCK_API_DELAY_MS) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

export class ApiError extends Error {
  readonly status: number | null;
  readonly code: string | null;

  constructor(
    message: string,
    options: { status?: number | null; code?: string | null } = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status ?? null;
    this.code = options.code ?? null;
  }
}

const API_BASE_URL = import.meta.env.VITE_API_URL.replace(/\/$/, '');

type ApiErrorBody = { message?: string | string[]; code?: string };

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError')
      throw error;
    throw new ApiError('Could not reach Alice Nook. Please try again.');
  }

  if (!response.ok) {
    let body: ApiErrorBody | null = null;
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      body = null;
    }
    const rawMessage = body?.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(', ')
      : rawMessage || `Request failed (${response.status})`;
    throw new ApiError(message, {
      status: response.status,
      code: body?.code ?? null,
    });
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
