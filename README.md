# Travel Planner Ultimate 2.0 Final

這是整理過的乾淨正式版，可直接上傳 GitHub 並由 Netlify 建置。

## 正確的根目錄

```text
public/
src/
.gitignore
index.html
netlify.toml
package.json
package-lock.json
README.md
tsconfig.app.json
tsconfig.json
vite.config.ts
VERSION.txt
```

以下檔案不應上傳，也不會再由新版建置設定產生：

```text
*.tsbuildinfo
vite.config.js
vite.config.d.ts
```

## GitHub 上傳

1. 解壓縮 ZIP。
2. 打開解壓縮後的資料夾。
3. `Ctrl + A` 全選資料夾內的內容。
4. 將全部內容直接拖曳至 GitHub 的 Upload files 區域。
5. 確認 GitHub 顯示 `src/...` 與 `public/...` 路徑後再 Commit。

## Netlify

```text
Build command: npm run build
Publish directory: dist
Functions directory: 留空
```

專案已包含 `netlify.toml`，Netlify 通常會自動套用。

## 目前核心功能

- 多旅行 Dashboard
- 新增、切換、編輯、複製及刪除旅行
- 旅行封面
- 獨立目的地、幣別及語言
- 時間軸與便條紙
- 一週天氣
- 分享唯讀旅行
- 列印／PDF
- PWA 基礎功能
