export interface ApiError {
  code: string;
  message: string;
}

export type ApiResponse<T> = { data: T; error?: never } | { data?: never; error: ApiError };

export class ApiClientError extends Error {
  code: string;
  status: number;

  constructor(error: ApiError, status: number) {
    super(error.message);
    this.code = error.code;
    this.status = status;
  }
}

/** Typed fetch helper expecting the `{ data, error }` envelope. */
export async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(input, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new ApiClientError({ code: 'NETWORK_ERROR', message: 'Network request failed.' }, 0);
  }

  const body = (await res.json().catch(() => null)) as ApiResponse<T> | null;

  if (!res.ok || !body || body.error) {
    throw new ApiClientError(
      body?.error ?? { code: 'UNKNOWN', message: `Request failed (${res.status}).` },
      res.status,
    );
  }
  return body.data;
}
