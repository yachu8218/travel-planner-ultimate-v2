# Travel Planner Ultimate v3.6.0 Atlas Debug 2

This diagnostic build temporarily removes route Polyline and disables Leaflet SVG/canvas overlays.
The map keeps tiles, markers, popups, fitBounds, flyTo and current-location control.

If the blue/yellow block disappears, the cause is confirmed as an old global SVG style affecting Leaflet's overlay pane.


## Atlas Clean 1
- 回憶地圖改為乾淨的 Leaflet + OpenStreetMap。
- 完全停用 Leaflet Marker、Shadow、SVG 與 Canvas 圖層。
- 景點標記改由獨立 React HTML overlay 顯示。
- 清除先前累積的 Atlas／Debug 地圖樣式。
