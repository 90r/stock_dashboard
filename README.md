# 韩国存储价格监控器

Cloudflare Workers + D1 + React/Vite 看板。v1 不使用官方 API key，后端通过低频 HTTP 抓取网页端数据并缓存，前端只读取本站 `/api/snapshot`。

## 数据口径

- K-stat/KITA：`ItemImpExpListWorker.screen` 和 `PumCtrImpExpListWorker.screen`
- HSK：DRAM `8542321010`，MCP/HBM proxy `8542323000`，NAND/Flash `8542321030`
- 单位价值：当月出口金额 `USD` / 当月出口重量 `kg`
- 月度涨跌幅图：出口单位价值 MoM 与海力士/三星月末收盘价 MoM 对比，均为相对上个月的涨跌百分比
- 股票：Naver Finance 日线 HTML，月度值取每月最后一个可用交易日收盘价
- 汇率缓存：后端抓取 Frankfurter 无 Key 历史接口，失败时回退到 jsDelivr 上的 currency-api 历史文件，供后续人民币视图使用

## 本地运行

```bash
npm install
npm run build
npm test
```

Cloudflare 本地 Worker：

```bash
npm run db:migrate:local
npm run cf:dev
```

前端开发服务器：

```bash
npm run dev
```

## 刷新数据

`wrangler.toml` 配置了每月 16、18、21 日 UTC 02:00 的 cron。手动刷新：

```bash
curl -X POST 'http://127.0.0.1:8787/api/refresh?months=1'
```

本地开发时也可以直接在浏览器打开同一个 `127.0.0.1` 地址触发刷新；非本地环境只允许 `POST`。

如果要覆盖较长历史窗口，不要在生产 Worker 里一次传很大的 `months`，否则会触发 Cloudflare 单次 Worker 的 subrequest 限制。先在本地 Worker 抓历史，再把本地 D1 上传到远端：

```bash
npm run backfill:local-upload -- --months=24
```

生产环境建议设置 `REFRESH_TOKEN`，设置后手动刷新需要：

```bash
curl -X POST -H 'Authorization: Bearer <token>' 'https://<worker>/api/refresh?months=1'
```

`months` 最大限制为 36。定时任务默认 `HISTORY_MONTHS=1`，生产环境建议每次 refresh 只抓 1 个月；历史回填用 `backfill:local-upload` 把本地 D1 作为源上传到远端。上传脚本会先清空远端 `customs_monthly`、`stock_monthly`、`exchange_rate_monthly`、`refresh_log`，再写入本地选定月份。

## D1 部署

一键部署：

```bash
npm run deploy:cloudflare
```

第一次运行时会检查 Cloudflare 登录状态；如果 `wrangler.toml` 里还是占位的 D1 `database_id`，脚本会自动创建 `korea_memory_monitor` 并写回配置，然后执行测试、远程迁移、构建和部署。

首次部署完成后先抓一次历史数据：

```bash
npm run backfill:local-upload -- --months=24
```

手动部署步骤：

1. 创建 D1：

   ```bash
   wrangler d1 create korea_memory_monitor
   ```

2. 将返回的 `database_id` 写入 `wrangler.toml`。
3. 执行迁移：

   ```bash
   npm run db:migrate:remote
   ```

4. 部署：

   ```bash
   npm run cf:deploy
   ```

## 说明

页面底部明确标注：这是韩国出口单位价值，不是 HBM 官方报价，也不是公司 ASP。若 K-stat IBSheet worker 协议变化，刷新任务会失败并保留已缓存数据。
