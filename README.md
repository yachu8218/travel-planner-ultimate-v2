# Travel Planner Ultimate v2.8.0 — 智慧航班資料庫

## 功能
輸入航班號與搭乘日期後，可查詢：

- 航空公司與航班號
- 出發／抵達機場
- 預定、修正或實際時間
- Terminal
- Gate
- 行李轉盤
- 航班狀態
- 機型與機身編號
- 飛行時間與距離

同一航班號在同一天有多筆結果時，會先列出班次供選擇。

## AeroDataBox 設定
本版使用 AeroDataBox 的 RapidAPI 版本。請先在 RapidAPI 訂閱 AeroDataBox，再把 RapidAPI Key 存入 Cloudflare Production Secret：

```text
AERODATABOX_API_KEY
```

金鑰尚未設定時，手動航班功能仍可正常使用。

## 更新方式
解壓縮後覆蓋 GitHub 原檔案並 Commit，Cloudflare Pages 會自動部署。請保留：

```text
functions/api/flight.ts 
```
