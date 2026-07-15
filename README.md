# Travel Planner Ultimate v3.1.2

本版專門修正 Cloudflare Pages 的 npm 建置問題。

## GitHub 請確認
- package-lock.json 已上傳
- package.json 已覆蓋
- .npmrc 已上傳
- .node-version 已上傳
- 沒有 pnpm-lock.yaml

## Cloudflare
Build command：npm run build
Build output directory：dist
NODE_VERSION：20.19.4

若 Cloudflare 平台仍出現 `Exit handler never called!`，可改用：
SKIP_DEPENDENCY_INSTALL=1
Build command：npm install --no-audit --no-fund --progress=false && npm run build
