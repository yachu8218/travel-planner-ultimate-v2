# Travel Planner Ultimate v3.6.0 Atlas Debug 1

This diagnostic build temporarily removes route Polyline and disables Leaflet SVG/canvas overlays.
The map keeps tiles, markers, popups, fitBounds, flyTo and current-location control.

If the blue/yellow block disappears, the cause is confirmed as an old global SVG style affecting Leaflet's overlay pane.
