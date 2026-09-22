import React, { useEffect, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { IoBedOutline, IoCalendarOutline, IoLeaf, IoPricetagOutline, IoRestaurant } from "react-icons/io5";
import { View, Text, StyleSheet } from "react-native";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import theme from "../../constants/theme";
import type { GeoCoordinates } from "../../lib/event-map-types";

export type MapboxWebMarker = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  imageUrl?: string | null;
  kind?: "event" | "happy_hour" | "restaurant" | "spa" | "hotel";
};

type Props = {
  center: GeoCoordinates;
  markers?: MapboxWebMarker[];
  selectedId?: string | null;
  onMarkerPress?: (marker: MapboxWebMarker) => void;
  height?: number;
  zoomLevel?: number;
  showCenterMarker?: boolean;
};

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

function markerIcon(kind: MapboxWebMarker["kind"]) {
  if (kind === "spa") return IoLeaf;
  if (kind === "hotel") return IoBedOutline;
  if (kind === "happy_hour") return IoPricetagOutline;
  if (kind === "event") return IoCalendarOutline;
  return IoRestaurant;
}

function createMarkerElement(marker: MapboxWebMarker, selected: boolean) {
  const button = document.createElement("button");
  button.type = "button";
  button.title = marker.title;
  button.setAttribute("aria-label", `${marker.kind ?? "place"}: ${marker.title}`);
  Object.assign(button.style, {
    width: selected ? "42px" : "36px",
    height: selected ? "42px" : "36px",
    padding: "0",
    border: `2px solid ${selected ? theme.COLORS.primary : "#ffffff"}`,
    borderRadius: "50%",
    background: "#16a34a",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxSizing: "border-box",
    boxShadow: "0 4px 12px rgba(15,23,42,0.32)",
  });

  const Icon = markerIcon(marker.kind);
  const root = createRoot(button);
  root.render(<Icon size={selected ? 17 : 13} aria-hidden style={{ display: "block" }} />);
  return { button, root };
}

export default function MapboxWebMap({
  center,
  markers = [],
  selectedId,
  onMarkerPress,
  height = 260,
  zoomLevel = 13,
  showCenterMarker = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapError, setMapError] = useState("");

  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN) {
      setMapError(MAPBOX_TOKEN ? "Map container is unavailable." : "Mapbox access token is not configured.");
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [center.longitude, center.latitude],
      zoom: zoomLevel,
      attributionControl: true,
    });
    mapRef.current = map;
    const markerInstances: mapboxgl.Marker[] = [];
    const roots: Root[] = [];

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    map.on("error", (event) => {
      if (event.error?.message) setMapError(event.error.message);
    });
    map.on("load", () => {
      setMapError("");
      if (showCenterMarker) {
        const current = document.createElement("div");
        Object.assign(current.style, {
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          border: "4px solid #ffffff",
          background: "#2563eb",
          boxShadow: "0 3px 10px rgba(15,23,42,0.28)",
        });
        markerInstances.push(new mapboxgl.Marker({ element: current }).setLngLat([center.longitude, center.latitude]).addTo(map));
      }
      markers.forEach((marker) => {
        const content = createMarkerElement(marker, marker.id === selectedId);
        content.button.addEventListener("click", () => {
          onMarkerPress?.(marker);
          map.flyTo({ center: [marker.longitude, marker.latitude], zoom: 15, duration: 450 });
        });
        roots.push(content.root);
        markerInstances.push(new mapboxgl.Marker({ element: content.button, anchor: "bottom" }).setLngLat([marker.longitude, marker.latitude]).addTo(map));
      });
    });

    return () => {
      markerInstances.forEach((marker) => marker.remove());
      roots.forEach((root) => root.unmount());
      map.remove();
      mapRef.current = null;
    };
  }, [center.latitude, center.longitude, markers, onMarkerPress, selectedId, showCenterMarker, zoomLevel]);

  if (!MAPBOX_TOKEN || mapError) {
    return <View style={[styles.unavailable, { height }]}><Text style={styles.unavailableText}>{mapError || "The Mapbox map is unavailable."}</Text></View>;
  }
  return <View style={[styles.container, { height }]}><View ref={(node) => { containerRef.current = node as unknown as HTMLDivElement | null; }} style={styles.map} /></View>;
}

const styles = StyleSheet.create({
  container: { width: "100%", overflow: "hidden", backgroundColor: "#dbeafe" },
  map: { width: "100%", height: "100%" },
  unavailable: { width: "100%", alignItems: "center", justifyContent: "center", padding: 20, backgroundColor: "#eff6ff" },
  unavailableText: { color: theme.COLORS.textSecondary, textAlign: "center", fontSize: 13, fontWeight: "600" },
});
