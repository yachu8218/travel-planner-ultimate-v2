# Travel Planner Ultimate v2.9.2 — Timeline 真正對齊版

本版將 Timeline 重構為真正的兩欄版面：

```text
06:00
  ～
09:00
  │
  │
 🚗
  │
  │
09:00
  ～
12:00
  │
  │
 ✈️
  │
  │
12:00
  ～
15:30
```

- 左欄：時間框、垂直線、小插畫
- 右欄：行程卡
- 小插畫不會再跑到行程卡中央
- 不顯示說明文字，也不加入小節點
- 原有 Cloudflare Secrets 不需要修改

解壓縮後覆蓋 GitHub 原檔案並 Commit，Cloudflare Pages 會自動部署。
