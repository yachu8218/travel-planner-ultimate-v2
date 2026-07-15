# Travel Planner Ultimate v2.8.4 — 航班中心正式修正版

## 本次修正

### 航班
- 狀態圓形文字完整置中
- 搜尋日期會存入航班卡
- 編輯航班時可修改日期
- 起飛與抵達時間顯示各機場當地時間，不再轉成手機所在時區
- 顯示 GMT 時差、航廈、Gate 與行李轉盤
- 未公布資料顯示「待公布」，不再留下大片空白
- 航班卡資訊重新排列並縮短高度
- 編輯後保留 API 航班資訊和檢查清單

### 地點
- 韓國、日本等目的地會嘗試同時取得當地語名稱與繁體中文名稱
- 店家、餐廳、甜點與景點卡片可並列顯示雙語名稱
- 查不到中文名稱時只顯示原名稱

## Cloudflare Secrets
沿用：

```text
RAPIDAPI_KEY
RAPIDAPI_HOST
GOOGLE_PLACES_API_KEY
```

## 更新方式
解壓縮後覆蓋 GitHub 原檔案並 Commit，Cloudflare Pages 會自動部署。
