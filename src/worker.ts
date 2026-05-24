import type { ApiError } from "./shared/types";
import { buildSnapshot } from "./worker/snapshot";
import { getAppKvValue, setAppKvValue } from "./worker/db";
import type { Env } from "./worker/env";
import { refreshSnapshot } from "./worker/refresh";
import { fetchTradesmartIpoTracker } from "./worker/scrapers/tradesmart-ipo";
import { emptyIpoSeekNewStock, fetchIpoSeekNewStock, type IpoSeekAuth } from "./worker/scrapers/iposeek";

const IPOSEEK_AUTH_KV_KEY = "iposeek_auth";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store"
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return json({ ok: true, time: new Date().toISOString() });
    }

    if (url.pathname === "/api/snapshot" && request.method === "GET") {
      try {
        return json(await buildSnapshot(env));
      } catch (error) {
        return jsonError("Snapshot unavailable", error, 500);
      }
    }

    if (url.pathname === "/api/ipo" && request.method === "GET") {
      try {
        return json(await fetchTradesmartIpoTracker(fetch));
      } catch (error) {
        return jsonError("IPO data unavailable", error, 502);
      }
    }

    if (url.pathname === "/api/ipo/a-share" && request.method === "GET") {
      try {
        return json(await fetchIpoSeekWithFallback(env, ctx));
      } catch (error) {
        return jsonError("A-share IPO data unavailable", error, 502);
      }
    }

    if (url.pathname === "/api/refresh" && (request.method === "POST" || (request.method === "GET" && isLocalRequest(url)))) {
      if (!isRefreshAuthorized(request, env)) {
        return jsonError("Unauthorized", "Missing or invalid refresh token", 401);
      }

      const months = Number(url.searchParams.get("months") ?? env.HISTORY_MONTHS ?? "1");
      const latestMonth = url.searchParams.get("month") ?? undefined;

      try {
        const result = await refreshSnapshot(env, { months, latestMonth });
        return json(result);
      } catch (error) {
        return jsonError("Refresh failed; old cached data was left in place", error, 502);
      }
    }

    if (url.pathname === "/api/refresh" && request.method === "GET") {
      return jsonError("Method not allowed", "Use POST; GET refresh is only enabled on localhost", 405);
    }

    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404 || url.pathname.includes(".")) {
      return assetResponse;
    }

    return env.ASSETS.fetch(new Request(new URL("/", url), request));
  },

  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(refreshSnapshot(env, { months: Number(env.HISTORY_MONTHS ?? "1") }));
  }
};

async function fetchIpoSeekWithFallback(env: Env, ctx: ExecutionContext) {
  if (!env.IPOSEEK_COOKIE && !env.IPOSEEK_ACCESS_TOKEN) {
    return emptyIpoSeekNewStock("Missing IPOSEEK_COOKIE or IPOSEEK_ACCESS_TOKEN");
  }

  const stored = await loadStoredIpoSeekAuth(env);
  const auth: IpoSeekAuth = {
    cookie: stored?.cookie ?? env.IPOSEEK_COOKIE,
    accessToken: stored?.accessToken ?? env.IPOSEEK_ACCESS_TOKEN,
    deviceFingerprint: stored?.deviceFingerprint ?? env.IPOSEEK_DEVICE_FINGERPRINT
  };

  try {
    return await fetchIpoSeekNewStock(auth, fetch, (next) => {
      ctx.waitUntil(persistIpoSeekAuth(env, next));
    });
  } catch (error) {
    return emptyIpoSeekNewStock(error instanceof Error ? error.message : String(error));
  }
}

async function loadStoredIpoSeekAuth(env: Env): Promise<IpoSeekAuth | null> {
  const raw = await getAppKvValue(env, IPOSEEK_AUTH_KV_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as IpoSeekAuth;
    if (!parsed || (!parsed.cookie && !parsed.accessToken)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function persistIpoSeekAuth(env: Env, auth: IpoSeekAuth): Promise<void> {
  await setAppKvValue(
    env,
    IPOSEEK_AUTH_KV_KEY,
    JSON.stringify({
      cookie: auth.cookie ?? null,
      accessToken: auth.accessToken ?? null,
      deviceFingerprint: auth.deviceFingerprint ?? null
    })
  );
}

function isRefreshAuthorized(request: Request, env: Env): boolean {
  if (!env.REFRESH_TOKEN) {
    return true;
  }

  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${env.REFRESH_TOKEN}`) {
    return true;
  }

  const token = new URL(request.url).searchParams.get("token");
  return token === env.REFRESH_TOKEN;
}

function isLocalRequest(url: URL): boolean {
  return url.hostname === "127.0.0.1" || url.hostname === "localhost";
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: JSON_HEADERS
  });
}

function jsonError(message: string, error: unknown, status: number): Response {
  const body: ApiError = {
    error: message,
    detail: error instanceof Error ? error.message : String(error)
  };
  return json(body, status);
}
