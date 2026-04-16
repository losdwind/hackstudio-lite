import { useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  useDelayRender,
  interpolate,
  Easing,
} from "remotion";
import mapboxgl, { Map } from "mapbox-gl";
import * as turf from "@turf/turf";
import { COLORS } from "../../../../shared/lib/colors";
import { expansionRoutes, chinaCoords } from "../../data/chart-data";
import type { Lang } from "../../../../shared/schemas/video-schema";

mapboxgl.accessToken = process.env.REMOTION_MAPBOX_TOKEN as string;

type Props = { lang: Lang };

// Route line coordinates: Beijing → each destination
const ROUTES = expansionRoutes.map((r) => ({
  name: r.target,
  coords: [chinaCoords, r.coords as [number, number]] as [number, number][],
}));

export const GlobalExpansionMap: React.FC<Props> = ({ lang }) => {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const { delayRender, continueRender } = useDelayRender();
  // Map uses Mapbox labels, no custom font/content needed here

  const [handle] = useState(() => delayRender("Loading map..."));
  const [map, setMap] = useState<Map | null>(null);

  // Initialize map once
  useEffect(() => {
    const _map = new Map({
      container: ref.current!,
      zoom: 1.8,
      center: [60, 25], // Centered between China and destinations
      pitch: 0,
      bearing: 0,
      style: "mapbox://styles/mapbox/standard",
      interactive: false,
      fadeDuration: 0,
      projection: "mercator",
    });

    _map.on("style.load", () => {
      // Hide all labels and features for clean dark map
      const hideFeatures = [
        "showRoadsAndTransit",
        "showRoads",
        "showTransit",
        "showPedestrianRoads",
        "showRoadLabels",
        "showTransitLabels",
        "showPlaceLabels",
        "showPointOfInterestLabels",
        "showPointsOfInterest",
        "showAdminBoundaries",
        "showLandmarkIcons",
        "showLandmarkIconLabels",
        "show3dObjects",
        "show3dBuildings",
        "show3dTrees",
        "show3dLandmarks",
        "show3dFacades",
      ];
      for (const feature of hideFeatures) {
        _map.setConfigProperty("basemap", feature, false);
      }
      _map.setConfigProperty("basemap", "colorMotorways", "transparent");
      _map.setConfigProperty("basemap", "colorRoads", "transparent");
      _map.setConfigProperty("basemap", "colorTrunks", "transparent");

      // China origin marker
      _map.addSource("china-marker", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { name: lang === "cn" ? "中国" : "China" },
              geometry: { type: "Point", coordinates: chinaCoords },
            },
          ],
        },
      });
      _map.addLayer({
        id: "china-glow",
        type: "circle",
        source: "china-marker",
        paint: {
          "circle-radius": 30,
          "circle-color": COLORS.primaryContainer,
          "circle-opacity": 0.15,
          "circle-blur": 1,
        },
      });
      _map.addLayer({
        id: "china-dot",
        type: "circle",
        source: "china-marker",
        paint: {
          "circle-radius": 12,
          "circle-color": COLORS.primaryContainer,
          "circle-stroke-width": 3,
          "circle-stroke-color": "#FFFFFF",
        },
      });
      _map.addLayer({
        id: "china-label",
        type: "symbol",
        source: "china-marker",
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
          "text-size": 44,
          "text-offset": [0, -1.2],
          "text-anchor": "bottom",
        },
        paint: {
          "text-color": "#FFFFFF",
          "text-halo-color": COLORS.surface,
          "text-halo-width": 2,
        },
      });

      // Add route lines + destination markers for each route
      ROUTES.forEach((route, i) => {
        const routeLine = turf.greatCircle(
          turf.point(route.coords[0]),
          turf.point(route.coords[1]),
          { npoints: 100 },
        );

        _map.addSource(`route-${i}`, {
          type: "geojson",
          data: routeLine,
        });
        _map.addLayer({
          id: `route-line-${i}`,
          type: "line",
          source: `route-${i}`,
          paint: {
            "line-color": COLORS.primaryContainer,
            "line-width": 3,
            "line-opacity": 0,
          },
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
        });

        // Destination marker
        _map.addSource(`dest-${i}`, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: { name: route.name[lang] },
                geometry: { type: "Point", coordinates: route.coords[1] },
              },
            ],
          },
        });
        _map.addLayer({
          id: `dest-glow-${i}`,
          type: "circle",
          source: `dest-${i}`,
          paint: {
            "circle-radius": 20,
            "circle-color": COLORS.tertiary,
            "circle-opacity": 0,
            "circle-blur": 1,
          },
        });
        _map.addLayer({
          id: `dest-dot-${i}`,
          type: "circle",
          source: `dest-${i}`,
          paint: {
            "circle-radius": 8,
            "circle-color": COLORS.tertiary,
            "circle-opacity": 0,
          },
        });
        _map.addLayer({
          id: `dest-label-${i}`,
          type: "symbol",
          source: `dest-${i}`,
          layout: {
            "text-field": ["get", "name"],
            "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
            "text-size": 36,
            "text-offset": [0, 1],
            "text-anchor": "top",
          },
          paint: {
            "text-color": "#FFFFFF",
            "text-halo-color": COLORS.surface,
            "text-halo-width": 2,
            "text-opacity": 0,
          },
        });
      });
    });

    _map.on("load", () => {
      continueRender(handle);
      setMap(_map);
    });
  }, [handle, lang]);

  // Animate routes based on frame
  useEffect(() => {
    if (!map) return;
    const animHandle = delayRender("Animating routes...");

    ROUTES.forEach((route, i) => {
      const lineStart = 30 + i * 50;
      const lineEnd = lineStart + 80;
      const markerStart = lineEnd - 15;

      // Route line opacity
      const lineOpacity = interpolate(frame, [lineStart, lineStart + 20], [0, 0.7], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

      // Animate the line by slicing
      const lineProgress = interpolate(frame, [lineStart, lineEnd], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.cubic),
      });

      const routeLine = turf.greatCircle(
        turf.point(route.coords[0]),
        turf.point(route.coords[1]),
        { npoints: 100 },
      );
      const totalDist = turf.length(routeLine);
      const currentDist = Math.max(0.001, totalDist * lineProgress);
      // greatCircle may return MultiLineString for antipodal routes — extract first line
      const geom = routeLine.geometry;
      const lineCoords = geom.type === "MultiLineString" ? geom.coordinates[0] : geom.coordinates;
      const safeLine = turf.lineString(lineCoords);
      const safeDist = turf.length(safeLine);
      const sliced = turf.lineSliceAlong(safeLine, 0, Math.min(currentDist, safeDist));

      const routeSource = map.getSource(`route-${i}`) as mapboxgl.GeoJSONSource;
      if (routeSource) {
        routeSource.setData(sliced);
      }
      if (map.getLayer(`route-line-${i}`)) {
        map.setPaintProperty(`route-line-${i}`, "line-opacity", lineOpacity);
      }

      // Destination marker
      const markerOpacity = interpolate(frame, [markerStart, markerStart + 20], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

      if (map.getLayer(`dest-glow-${i}`)) {
        map.setPaintProperty(`dest-glow-${i}`, "circle-opacity", markerOpacity * 0.2);
      }
      if (map.getLayer(`dest-dot-${i}`)) {
        map.setPaintProperty(`dest-dot-${i}`, "circle-opacity", markerOpacity);
      }
      if (map.getLayer(`dest-label-${i}`)) {
        map.setPaintProperty(`dest-label-${i}`, "text-opacity", markerOpacity);
      }
    });

    map.once("idle", () => continueRender(animHandle));
  }, [frame, map, fps]);

  const style: React.CSSProperties = useMemo(
    () => ({ width, height, position: "absolute" as const }),
    [width, height],
  );

  return (
    <AbsoluteFill>
      <div ref={ref} style={style} />
    </AbsoluteFill>
  );
};
