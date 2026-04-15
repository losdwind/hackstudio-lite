import { useEffect, useMemo, useRef, useState } from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill,
  useDelayRender,
  interpolate,
  Easing,
} from "remotion";
import mapboxgl, { Map } from "mapbox-gl";
import * as turf from "@turf/turf";
import { COLORS } from "../../lib/colors";
import { expansionRoutes, chinaCoords } from "../../data/chart-data";
import type { Lang } from "../../schemas/video-schema";
import { getFontFamily } from "../../lib/fonts";
import { contentCN } from "../../data/content-cn";
import { contentEN } from "../../data/content-en";

mapboxgl.accessToken = process.env.REMOTION_MAPBOX_TOKEN as string;

type Props = { lang: Lang };

export const GlobalExpansionMap: React.FC<Props> = ({ lang }) => {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { delayRender, continueRender } = useDelayRender();
  const fontFamily = getFontFamily(lang);
  const content = lang === "cn" ? contentCN.part4 : contentEN.part4;

  const [handle] = useState(() => delayRender("Loading map..."));
  const [map, setMap] = useState<Map | null>(null);

  // Initialize map
  useEffect(() => {
    const _map = new Map({
      container: ref.current!,
      zoom: 3,
      center: [chinaCoords[0], chinaCoords[1]],
      pitch: 0,
      bearing: 0,
      style: "mapbox://styles/mapbox/standard",
      interactive: false,
      fadeDuration: 0,
    });

    _map.on("style.load", () => {
      // Hide default features for clean look
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

      // Add source for China marker
      _map.addSource("china-marker", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { name: lang === "cn" ? "中国" : "China" },
              geometry: {
                type: "Point",
                coordinates: chinaCoords,
              },
            },
          ],
        },
      });

      _map.addLayer({
        id: "china-dot",
        type: "circle",
        source: "china-marker",
        paint: {
          "circle-radius": 30,
          "circle-color": COLORS.xiaomiOrange,
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
          "text-size": 40,
          "text-offset": [0, 0.5],
          "text-anchor": "top",
        },
        paint: {
          "text-color": "#FFFFFF",
          "text-halo-color": "#000000",
          "text-halo-width": 2,
        },
      });

      // Add route lines source (one per route)
      expansionRoutes.forEach((route, i) => {
        _map.addSource(`route-${i}`, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: [chinaCoords] },
          },
        });

        _map.addLayer({
          type: "line",
          source: `route-${i}`,
          id: `route-line-${i}`,
          paint: {
            "line-color": COLORS.xiaomiOrange,
            "line-width": 3,
            "line-opacity": 0.7,
          },
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
        });

        // Destination markers
        _map.addSource(`dest-${i}`, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: { name: route.target[lang] },
                geometry: { type: "Point", coordinates: route.coords },
              },
            ],
          },
        });

        _map.addLayer({
          id: `dest-dot-${i}`,
          type: "circle",
          source: `dest-${i}`,
          paint: {
            "circle-radius": 20,
            "circle-color": COLORS.accentBlue,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#FFFFFF",
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
            "text-size": 32,
            "text-offset": [0, 0.5],
            "text-anchor": "top",
          },
          paint: {
            "text-color": "#FFFFFF",
            "text-halo-color": "#000000",
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
  }, [handle]);

  // Animate per frame
  useEffect(() => {
    if (!map) return;

    const animHandle = delayRender("Animating map...");

    // Phase 1 (0-90): Camera on China, marker pulsing
    // Phase 2 (90-270): Lines extend to destinations
    // Phase 3 (270-360): Camera zooms out

    // Camera zoom out in phase 3
    const zoomProgress = interpolate(frame, [0, 90, 270, 360], [3, 3, 1.5, 1.5], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.sin),
    });

    map.setZoom(zoomProgress);
    map.setCenter([
      interpolate(frame, [0, 270, 360], [chinaCoords[0], chinaCoords[0], 60], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
      interpolate(frame, [0, 270, 360], [chinaCoords[1], chinaCoords[1], 25], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    ]);

    // Animate route lines
    expansionRoutes.forEach((route, i) => {
      const lineStart = 90 + i * 40;
      const lineEnd = lineStart + 80;

      const lineProgress = interpolate(frame, [lineStart, lineEnd], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.cubic),
      });

      if (lineProgress > 0) {
        const routeLine = turf.lineString([chinaCoords, route.coords]);
        const routeDistance = turf.length(routeLine);
        const currentDistance = Math.max(0.001, routeDistance * lineProgress);
        const slicedLine = turf.lineSliceAlong(routeLine, 0, currentDistance);

        const source = map.getSource(`route-${i}`) as mapboxgl.GeoJSONSource;
        if (source) {
          source.setData(slicedLine);
        }
      }

      // Show destination marker when line is complete
      const markerOpacity = interpolate(
        frame,
        [lineEnd - 10, lineEnd + 10],
        [0, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
      );

      map.setPaintProperty(`dest-dot-${i}`, "circle-opacity", markerOpacity);
      map.setPaintProperty(`dest-label-${i}`, "text-opacity", markerOpacity);
    });

    map.once("idle", () => continueRender(animHandle));
  }, [frame, map]);

  const style: React.CSSProperties = useMemo(
    () => ({ width, height, position: "absolute" as const }),
    [width, height],
  );

  return (
    <AbsoluteFill>
      <div ref={ref} style={style} />
      {/* Title overlay */}
      <div
        style={{
          position: "absolute",
          top: 30,
          width: "100%",
          textAlign: "center",
          fontSize: 48,
          fontWeight: 700,
          color: COLORS.textPrimary,
          fontFamily,
          textShadow: "0 2px 10px rgba(0,0,0,0.8)",
          opacity: interpolate(frame, [0, 20], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        {content.mapTitle}
      </div>
    </AbsoluteFill>
  );
};
