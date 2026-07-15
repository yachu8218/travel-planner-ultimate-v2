# Travel Planner Ultimate v3.1.1

## Cloudflare Pages 建置穩定版

本版專門修正：

```text
npm error Exit handler never called!
tsc: not found
```

專案已改用 `pnpm 9.15.9`，並移除 `package-lock.json`。

### 上傳 GitHub 時請確認

- `pnpm-lock.yaml` 有上傳
- `package.json` 有覆蓋
- `package-lock.json` 已從 GitHub 刪除

### Cloudflare Build 設定

```text
Build command: pnpm run build
Build output directory: dist
```

已設定的 `NODE_VERSION=20.19.4` 可以保留。
