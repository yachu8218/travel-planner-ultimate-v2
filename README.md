# Travel Planner Ultimate 2.1 — 第二步

這一版可直接覆蓋目前 GitHub Repository 內的同名檔案。

## 本次新增

- 每日行程改成 Day 1、Day 2、Day 3 分頁顯示
- 前一天／後一天切換
- 每日摘要：安排數、交通段數、通勤分鐘
- 便條紙待辦功能強化
- 交通方式下拉選單
- 步行、地鐵、公車、計程車、自駕、火車／高鐵／KTX、飛機、渡輪
- 出發地、抵達地、通勤時間、距離、路線／車次欄位
- 飛機卡可先記錄航班號碼（即時航班搜尋在第三步）
- 六種可設定主題，每趟旅行可使用不同主題
- 主題會同步套用首頁卡片、行程、按鈕、便條與列印樣式
- 舊版 2.0 的本機行程資料可繼續使用

## 六種主題

1. 夏日陽光
2. 復古手帳
3. 櫻花旅行
4. 森林療癒
5. 海岸假期
6. 灰紫信紙

## 更新 GitHub

1. 解壓縮 ZIP。
2. 打開解壓後的資料夾。
3. `Ctrl + A` 全選裡面的內容。
4. 拖進原本的 `travel-planner-ultimate-v2` Repository 的 Upload files。
5. GitHub 會顯示同名檔案已更新。
6. 按 Commit changes。
7. Netlify 會自動重新部署。

不需要建立新的 Repository，也不要刪除原本的旅行資料。

## Netlify

- Build command：`npm run build`
- Publish directory：`dist`
- Functions directory：保持目前設定即可
