# Travel Planner Ultimate v2.6.0 — Google Places 智慧搜尋整合

## 新增功能
在新增景點、餐廳、甜點或住宿時，輸入至少兩個字，App 會自動顯示 Google Places 建議清單。

選擇正確店家後，自動帶入：
- 正式名稱
- 地址
- 營業時間
- 目前是否營業
- 電話
- 官方網站
- Google 評分與評價數量

Google Places 無法使用或尚未設定金鑰時，仍可按「重新搜尋完整資料」，系統會退回免費地址搜尋。

## Cloudflare
需設定 Secret：

```text
GOOGLE_PLACES_API_KEY
```

更新 ZIP 覆蓋 GitHub 後 Commit，Cloudflare Pages 會自動部署。
