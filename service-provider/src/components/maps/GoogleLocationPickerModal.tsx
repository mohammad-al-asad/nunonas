"use client";

import {
  loadGoogleMaps,
  toGoogleLatLngLiteral,
  type GoogleAdvancedMarkerInstance,
  type GoogleGeocoderResult,
  type GoogleLatLngLiteral,
  type GoogleMapInstance,
  type GoogleMapMouseEvent,
  type GoogleMarkerPosition,
  type ReadyGoogleMaps,
} from "@/lib/google-maps";
import { LocateFixed, MapPin, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const GOOGLE_MAPS_MAP_ID =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";
const DHAKA_FALLBACK = { lat: 23.8103, lng: 90.4125 };

type GeocoderInstance = InstanceType<ReadyGoogleMaps["Geocoder"]>;

type Props = {
  open: boolean;
  title?: string;
  initialAddress?: string;
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  onClose: () => void;
  onConfirm: (location: {
    address: string;
    latitude: number;
    longitude: number;
  }) => void;
};

function validCoordinates(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): GoogleLatLngLiteral | null {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Number(latitude) < -90 ||
    Number(latitude) > 90 ||
    Number(longitude) < -180 ||
    Number(longitude) > 180
  ) {
    return null;
  }
  return { lat: Number(latitude), lng: Number(longitude) };
}

function browserLocation(): Promise<GoogleLatLngLiteral | null> {
  if (!navigator.geolocation) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8_000, maximumAge: 300_000 },
    );
  });
}

function geocodeAddress(
  geocoder: GeocoderInstance,
  address: string,
): Promise<{ address: string; coordinates: GoogleLatLngLiteral } | null> {
  return new Promise((resolve) => {
    geocoder.geocode(
      { address },
      (results: GoogleGeocoderResult[] | null, status: string) => {
        const result = results?.[0];
        const coordinates = toGoogleLatLngLiteral(
          result?.geometry?.location,
        );
        resolve(
          status === "OK" && coordinates
            ? {
                address: result?.formatted_address || address,
                coordinates,
              }
            : null,
        );
      },
    );
  });
}

function reverseGeocode(
  geocoder: GeocoderInstance,
  coordinates: GoogleLatLngLiteral,
): Promise<string> {
  return new Promise((resolve) => {
    geocoder.geocode(
      { location: coordinates },
      (results: GoogleGeocoderResult[] | null, status: string) => {
        resolve(
          status === "OK" && results?.[0]?.formatted_address
            ? results[0].formatted_address
            : `Coordinates (${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)})`,
        );
      },
    );
  });
}

export function GoogleLocationPickerModal({
  open,
  title = "Choose location",
  initialAddress = "",
  initialLatitude,
  initialLongitude,
  onClose,
  onConfirm,
}: Props) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMapInstance | null>(null);
  const markerRef = useRef<GoogleAdvancedMarkerInstance | null>(null);
  const geocoderRef = useRef<GeocoderInstance | null>(null);
  const [coordinates, setCoordinates] =
    useState<GoogleLatLngLiteral | null>(null);
  const [address, setAddress] = useState(initialAddress);
  const [searchText, setSearchText] = useState(initialAddress);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  const updatePosition = useCallback(
    async (position: GoogleMarkerPosition, shouldReverseGeocode = true) => {
      const next = toGoogleLatLngLiteral(position);
      if (!next) return;
      if (markerRef.current) markerRef.current.position = next;
      mapRef.current?.setCenter(next);
      setCoordinates(next);
      if (shouldReverseGeocode && geocoderRef.current) {
        const nextAddress = await reverseGeocode(geocoderRef.current, next);
        setAddress(nextAddress);
        setSearchText(nextAddress);
      }
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let map: GoogleMapInstance | null = null;
    let marker: GoogleAdvancedMarkerInstance | null = null;
    setLoading(true);
    setError("");
    setAddress(initialAddress);
    setSearchText(initialAddress);
    setCoordinates(null);

    void (async () => {
      try {
        if (!GOOGLE_MAPS_API_KEY) {
          throw new Error(
            "Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable the location picker.",
          );
        }
        const googleMaps = await loadGoogleMaps(GOOGLE_MAPS_API_KEY);
        if (cancelled) return;
        const geocoder = new googleMaps.Geocoder();
        geocoderRef.current = geocoder;

        let resolvedAddress = initialAddress.trim();
        let initialPosition = validCoordinates(
          initialLatitude,
          initialLongitude,
        );
        if (!initialPosition && resolvedAddress.length > 3) {
          const geocoded = await geocodeAddress(geocoder, resolvedAddress);
          if (geocoded) {
            initialPosition = geocoded.coordinates;
            resolvedAddress = geocoded.address;
          }
        }
        if (!initialPosition) {
          initialPosition = await browserLocation();
        }
        initialPosition ??= DHAKA_FALLBACK;

        if (!mapElementRef.current || cancelled) return;
        map = new googleMaps.Map(mapElementRef.current, {
          center: initialPosition,
          zoom: 15,
          mapId: GOOGLE_MAPS_MAP_ID,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        marker = new googleMaps.AdvancedMarkerElement({
          map,
          position: initialPosition,
          gmpDraggable: true,
          title: "Selected location",
        });
        mapRef.current = map;
        markerRef.current = marker;
        setCoordinates(initialPosition);

        if (!resolvedAddress) {
          resolvedAddress = await reverseGeocode(geocoder, initialPosition);
        }
        if (!cancelled) {
          setAddress(resolvedAddress);
          setSearchText(resolvedAddress);
        }

        map.addListener("click", (event: GoogleMapMouseEvent) => {
          if (event.latLng) void updatePosition(event.latLng);
        });
        marker.addListener("dragend", () => {
          if (marker?.position) void updatePosition(marker.position);
        });
      } catch (mapError) {
        if (!cancelled) {
          setError(
            mapError instanceof Error
              ? mapError.message
              : "Google Maps could not be initialized.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      const eventApi = window.google?.maps?.event;
      if (eventApi && map) eventApi.clearInstanceListeners(map);
      if (eventApi && marker) eventApi.clearInstanceListeners(marker);
      if (marker) marker.map = null;
      mapRef.current = null;
      markerRef.current = null;
      geocoderRef.current = null;
    };
  }, [
    initialAddress,
    initialLatitude,
    initialLongitude,
    open,
    updatePosition,
  ]);

  const handleSearch = async () => {
    const geocoder = geocoderRef.current;
    const query = searchText.trim();
    if (!geocoder || query.length < 3) {
      setError("Enter at least three characters to search for an address.");
      return;
    }
    setSearching(true);
    setError("");
    try {
      const result = await geocodeAddress(geocoder, query);
      if (!result) {
        setError("Google Maps could not find that address.");
        return;
      }
      setAddress(result.address);
      setSearchText(result.address);
      await updatePosition(result.coordinates, false);
    } finally {
      setSearching(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[190] overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="mx-auto my-4 w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl sm:my-8">
        <div className="flex items-start justify-between border-b border-slate-100 p-5 sm:p-6">
          <div>
            <h2 className="text-xl font-black text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Search, tap the map, or drag the marker to set the exact location.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close location picker"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Search address</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleSearch();
                  }
                }}
                placeholder="Search venue, street, or area"
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
            </label>
            <button
              type="button"
              disabled={searching || loading}
              onClick={() => void handleSearch()}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1e2a5e] px-5 text-sm font-black text-white disabled:opacity-50"
            >
              <Search className="h-4 w-4" />
              {searching ? "Searching..." : "Find address"}
            </button>
          </div>

          {error ? (
            <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {error}
            </p>
          ) : null}

          <div className="relative h-[420px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
            <div ref={mapElementRef} className="h-full w-full" />
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/85 text-sm font-bold text-slate-500">
                Loading your location...
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
                <MapPin className="h-4 w-4" />
                Selected location
              </p>
              <p className="mt-1 truncate text-sm font-bold text-slate-800">
                {address || "Choose a point on the map"}
              </p>
              {coordinates ? (
                <p className="mt-1 text-xs text-slate-500">
                  {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              disabled={!coordinates}
              onClick={() => {
                if (!coordinates) return;
                onConfirm({
                  address:
                    address ||
                    `Coordinates (${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)})`,
                  latitude: coordinates.lat,
                  longitude: coordinates.lng,
                });
              }}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 text-sm font-black text-white disabled:opacity-50"
            >
              <LocateFixed className="h-4 w-4" />
              Use this location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
