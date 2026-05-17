export type Fetcher = typeof fetch;

export interface FetchTextOptions {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
}

const DEFAULT_TIMEOUT_MS = 12_000;

export async function fetchTextWithRetry(
  fetcher: Fetcher,
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: FetchTextOptions = {}
): Promise<string> {
  const retries = options.retries ?? 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort("request timeout"), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetcher(input, { ...init, signal: controller.signal });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < retries) {
        await delay(options.retryDelayMs ?? 500);
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError ?? new Error("request failed");
}

export async function fetchDecodedTextWithRetry(
  fetcher: Fetcher,
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: FetchTextOptions & { encoding?: string } = {}
): Promise<string> {
  const retries = options.retries ?? 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort("request timeout"), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetcher(input, { ...init, signal: controller.signal });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      const buffer = await response.arrayBuffer();
      return decodeText(buffer, options.encoding ?? "utf-8");
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < retries) {
        await delay(options.retryDelayMs ?? 500);
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError ?? new Error("request failed");
}

export function decodeText(buffer: ArrayBuffer, encoding: string): string {
  try {
    return new TextDecoder(encoding).decode(buffer);
  } catch {
    return new TextDecoder().decode(buffer);
  }
}

export function delay(ms: number): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => setTimeout(resolve, ms));
}
