import { describe, expect, it, vi } from "vitest";
import { fetchKitaTotalMonthly } from "../src/worker/scrapers/kita";
import { fetchNaverMonthlyRows } from "../src/worker/scrapers/naver";
import { fetchMonthlyExchangeRateRows } from "../src/worker/scrapers/exchange-rate";
import { fetchIpoSeekNewStock } from "../src/worker/scrapers/iposeek";
import {
  FRANKFURTER_EXCHANGE_RATE_JSON,
  IPOSEEK_BOARD_COUNTS_JSON,
  IPOSEEK_NEW_STOCK_JSON,
  IPOSEEK_STATUS_COUNTS_JSON,
  KITA_ITEM_AMT_XML,
  KITA_ITEM_WGT_XML,
  NAVER_HTML
} from "./fixtures";

describe("scraper integrations with mocked HTTP", () => {
  it("fetches K-stat amount and weight templates successfully", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response(KITA_ITEM_AMT_XML, { status: 200 }))
      .mockResolvedValueOnce(new Response(KITA_ITEM_WGT_XML, { status: 200 }));

    const result = await fetchKitaTotalMonthly(fetcher as unknown as typeof fetch, "dram", "8542321010", "2026-03", 0);

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(result.exportUsd).toBe(8_012_443_877);
    expect(result.exportWeight).toBe(145_289);
  });

  it("fails clearly when K-stat shape no longer contains the requested row", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response("<SHEET><DATA></DATA></SHEET>", { status: 200 }))
      .mockResolvedValueOnce(new Response(KITA_ITEM_WGT_XML, { status: 200 }));

    await expect(fetchKitaTotalMonthly(fetcher as unknown as typeof fetch, "dram", "8542321010", "2026-03", 0)).rejects.toThrow(
      "did not include HSK"
    );
  });

  it("propagates upstream HTTP failures after retry attempts", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("blocked", { status: 503, statusText: "Service Unavailable" }));

    await expect(fetchKitaTotalMonthly(fetcher as unknown as typeof fetch, "dram", "8542321010", "2026-03", 0)).rejects.toThrow("HTTP 503");
    expect(fetcher).toHaveBeenCalled();
  });

  it("fetches Naver pages and keeps last trading day by month", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(NAVER_HTML, { status: 200 }));
    const rows = await fetchNaverMonthlyRows(fetcher as unknown as typeof fetch, "000660", ["2026-02", "2026-03"], 0);

    expect(rows).toHaveLength(2);
    expect(rows.at(-1)).toMatchObject({ month: "2026-03", closeKrw: 180000 });
  });

  it("fetches Frankfurter exchange-rate rows and keeps last rate by month", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(FRANKFURTER_EXCHANGE_RATE_JSON, { status: 200 }));
    const rows = await fetchMonthlyExchangeRateRows(fetcher as unknown as typeof fetch, ["2026-02", "2026-03"], 0);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(rows.at(-1)).toMatchObject({ month: "2026-03", rateDate: "2026-03-31", usdCny: 6.8628, cnyKrw: 217.09, source: "Frankfurter" });
  });

  it("fetches IpoSeek A-share issuance rows with bearer auth", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response(IPOSEEK_NEW_STOCK_JSON, { status: 200 }))
      .mockResolvedValueOnce(new Response(IPOSEEK_BOARD_COUNTS_JSON, { status: 200 }))
      .mockResolvedValueOnce(new Response(IPOSEEK_STATUS_COUNTS_JSON, { status: 200 }));

    const tracker = await fetchIpoSeekNewStock({ accessToken: "test-token" }, fetcher as unknown as typeof fetch);

    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(tracker.total).toBe(1644);
    expect(tracker.statusCounts["启动发行"]).toBe(2);
    expect(tracker.items[0]).toMatchObject({
      shareCode: "301669",
      shareName: "高特电子",
      issuanceStatus: "发行中"
    });
  });

  it("refreshes IpoSeek access token when a refresh cookie is available", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "fresh-token", expires_in: 3600 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(IPOSEEK_NEW_STOCK_JSON, { status: 200 }))
      .mockResolvedValueOnce(new Response(IPOSEEK_BOARD_COUNTS_JSON, { status: 200 }))
      .mockResolvedValueOnce(new Response(IPOSEEK_STATUS_COUNTS_JSON, { status: 200 }));

    await fetchIpoSeekNewStock({ cookie: "refresh_token=test-refresh; access_token=stale-token" }, fetcher as unknown as typeof fetch);

    const listCall = fetcher.mock.calls[1];
    const init = listCall[1] as RequestInit;
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer fresh-token");
  });
});
