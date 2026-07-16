# Travel Planner Ultimate v3.2.1

## 修正
- 修復 `index.html` 被程式內容覆蓋造成的 Vite HTML parse error。
- 保留 Cloudflare KV 唯讀短網址功能。
- 保留 v3.1.1 已成功的 pnpm 建置方式。

## Cloudflare Build
- Build command：`npm run build`
- Build output：`dist`
- NODE_VERSION：`20.19.4`

Cloudflare 會依 `packageManager` 自動使用 pnpm。

## KV
Pages → Settings → Bindings → KV namespace
Variable name：`TRIP_SHARES`
