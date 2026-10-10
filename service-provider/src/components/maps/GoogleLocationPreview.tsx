"use client";

import {
  loadGoogleMaps,
  type GoogleAdvancedMarkerInstance,
  type GoogleMapInstance,
} from "@/lib/google-maps";
import { useEffect, useRef, useState } from "react";

const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const GOOGLE_MAPS_MAP_ID =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

type Props = {
  latitude: number;
  longitude: number;
  className?: string;
};

/** Read-only Google map with a marker, used to preview a chosen location. */
export function GoogleLocationPreview({ latitude, longitude, className }: Props) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMapInstance | null>(null);
  const markerRef = useRef<GoogleAdvancedMarkerInstance | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const position = { lat: latitude, lng: longitude };
    if (mapRef.current && markerRef.current) {
      mapRef.current.setCenter(position);
      markerRef.current.position = position;
      return;
    }

    let cancelled = false;
    loadGoogleMaps(GOOGLE_MAPS_API_KEY)
      .then((googleMaps) => {
        if (cancelled || !mapElementRef.current) return;
        const map = new googleMaps.Map(mapElementRef.current, {
          center: position,
          zoom: 15,
          mapId: GOOGLE_MAPS_MAP_ID,
          disableDefaultUI: true,
          gestureHandling: "none",
          keyboardShortcuts: false,
          clickableIcons: false,
        });
        mapRef.current = map;
        markerRef.current = new googleMaps.AdvancedMarkerElement({ map, position });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [latitude, longitude]);

  useEffect(
    () => () => {
      if (markerRef.current) markerRef.current.map = null;
      mapRef.current = null;
      markerRef.current = null;
    },
    [],
  );

  if (failed) return null;
  return <div ref={mapElementRef} className={className} aria-hidden="true" />;
}
