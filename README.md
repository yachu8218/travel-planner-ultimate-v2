# Travel Planner Ultimate v2.8.1 — RapidAPI 修正版

## Cloudflare Production Secrets

本版只使用：

```text
RAPIDAPI_KEY
RAPIDAPI_HOST
```

`RAPIDAPI_HOST` 的值：

```text
aerodatabox.p.rapidapi.com
```

不再使用：

```text
AERODATABOX_API_KEY
```

## 修正內容
- RapidAPI Secret 名稱與目前 Cloudflare 設定一致
- 金鑰、Host、訂閱或配額錯誤會顯示明確原因
- 配額不足時自動切換為手動建立航班
- 航班快取功能保留

## 更新方式
解壓縮後覆蓋 GitHub 原檔案並 Commit，Cloudflare Pages 會自動部署。
