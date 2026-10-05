import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, type Region } from "react-native-maps";
import Supercluster from "supercluster";
import { Ionicons } from "@expo/vector-icons";
import type { GeoCoordinates } from "../../lib/event-map-types";

export type MarkerKind = "event" | "happy_hour" | "restaurant" | "spa" | "hotel";
export type NativeMapMarker = { id: string; coordinate: GeoCoordinates; onPress?: () => void; title?: string; kind?: MarkerKind; children?: React.ReactNode };
export type NativeGoogleMapHandle = { animateCamera: (camera: { center: GeoCoordinates; zoom?: number }, options?: { duration?: number }) => void };

type Props = {
  center: GeoCoordinates;
  markers?: NativeMapMarker[];
  zoomLevel?: number;
  height?: number;
  showUserLocation?: boolean;
  routeCoordinates?: GeoCoordinates[];
  /** Kept for API compatibility with the old WebView map; native maps pan on drag instead. */
  onPullToRefresh?: () => void;
};

// Beyond this zoom every place is shown as its own category pin.
const CLUSTER_MAX_ZOOM = 15;
const CLUSTER_RADIUS = 60;

const KIND_STYLE: Record<MarkerKind, { color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  restaurant: { color: "#f97316", icon: "restaurant" },
  spa: { color: "#ec4899", icon: "leaf" },
  hotel: { color: "#2563eb", icon: "bed" },
  event: { color: "#8b5cf6", icon: "calendar" },
  happy_hour: { color: "#eab308", icon: "pricetag" },
};

// Hide Google's own places (shops, restaurants, transit stops) so only the app's markers show.
const MAP_STYLE = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
];

const zoomToDelta = (zoom: number) => 360 / 2 ** zoom;

type Viewport = { bbox: [number, number, number, number]; zoom: number };

function regionFor(center: GeoCoordinates, zoom: number): Region {
  const delta = zoomToDelta(zoom);
  return { latitude: center.latitude, longitude: center.longitude, latitudeDelta: delta, longitudeDelta: delta };
}

// Estimate of the visible area until the map reports its real bounds.
function viewportFor(center: GeoCoordinates, zoom: number): Viewport {
  const delta = zoomToDelta(zoom);
  return { bbox: [center.longitude - delta, center.latitude - delta, center.longitude + delta, center.latitude + delta], zoom };
}

function CategoryPin({ kind }: { kind: MarkerKind }) {
  const { color, icon } = KIND_STYLE[kind];
  return (
    <View style={styles.pinWrap} collapsable={false}>
      <View style={[styles.pin, { backgroundColor: color }]}>
        <Ionicons name={icon} size={18} color="#ffffff" />
      </View>
      <View style={[styles.pinTail, { borderTopColor: color }]} />
    </View>
  );
}

function ClusterBubble({ count }: { count: number }) {
  // Bigger groups get a bigger circle, like the reference design.
  const size = count < 10 ? 44 : count < 50 ? 52 : count < 200 ? 60 : 68;
  // Android snapshots custom markers into a bitmap at the measured size; a fixed,
  // padded box keeps the circle from being clipped while the text lays out.
  const box = size + 8;
  return (
    <View style={[styles.clusterBox, { width: box, height: box }]} collapsable={false}>
      <View style={[styles.cluster, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={styles.clusterText}>{count}</Text>
      </View>
    </View>
  );
}

const NativeGoogleMap = forwardRef<NativeGoogleMapHandle, Props>(function NativeGoogleMap(
  { center, markers = [], zoomLevel = 13, height, showUserLocation = true, routeCoordinates = [] },
  ref,
) {
  const mapRef = useRef<MapView>(null);
  const [viewport, setViewport] = useState<Viewport>(() => viewportFor(center, zoomLevel));

  // Read the visible area straight from the map. On Android the map can report a
  // zero-size region before it has been laid out, which would hide every marker.
  const refreshViewport = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;
    try {
      const [bounds, camera] = await Promise.all([map.getMapBoundaries(), map.getCamera()]);
      const { northEast, southWest } = bounds;
      if (northEast.latitude === southWest.latitude || northEast.longitude === southWest.longitude) return;
      setViewport({
        bbox: [southWest.longitude, southWest.latitude, northEast.longitude, northEast.latitude],
        zoom: Math.round(camera.zoom ?? zoomLevel),
      });
    } catch {
      // Keep the last known viewport if the map isn't ready yet.
    }
  }, [zoomLevel]);
  // Custom marker views must track changes until their icons have rendered, then stop for performance.
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useImperativeHandle(ref, () => ({
    animateCamera: (camera, options) => mapRef.current?.animateCamera({ center: camera.center, zoom: camera.zoom }, { duration: options?.duration ?? 450 }),
  }));

  // Follow center/zoom prop changes (e.g. a screen selecting a place or recentering).
  useEffect(() => {
    mapRef.current?.animateCamera({ center, zoom: zoomLevel }, { duration: 450 });
  }, [center.latitude, center.longitude, zoomLevel]);

  // Screens rebuild their marker arrays on every render; only re-cluster when the places actually change.
  const markersKey = markers.map((marker) => `${marker.id}:${marker.coordinate.latitude}:${marker.coordinate.longitude}`).join("|");
  const index = useMemo(() => {
    const cluster = new Supercluster<{ markerIndex: number }>({ radius: CLUSTER_RADIUS, maxZoom: CLUSTER_MAX_ZOOM });
    cluster.load(
      markers
        .map((marker, markerIndex) => ({ marker, markerIndex }))
        .filter(({ marker }) => Number.isFinite(marker.coordinate.latitude) && Number.isFinite(marker.coordinate.longitude))
        .map(({ marker, markerIndex }) => ({
          type: "Feature" as const,
          properties: { markerIndex },
          geometry: { type: "Point" as const, coordinates: [marker.coordinate.longitude, marker.coordinate.latitude] },
        })),
    );
    return cluster;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markersKey]);

  const features = useMemo(() => index.getClusters(viewport.bbox, viewport.zoom), [index, viewport]);

  useEffect(() => {
    setTracksViewChanges(true);
    const timer = setTimeout(() => setTracksViewChanges(false), 1000);
    return () => clearTimeout(timer);
  }, [features]);

  return (
    <View style={[styles.container, height != null && { height }]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        customMapStyle={MAP_STYLE}
        // The app is light-only; don't let the map follow the phone's dark mode.
        userInterfaceStyle="light"
        showsPointsOfInterests={false}
        style={StyleSheet.absoluteFill}
        initialRegion={regionFor(center, zoomLevel)}
        onMapLoaded={refreshViewport}
        onRegionChangeComplete={refreshViewport}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        moveOnMarkerPress={false}
      >
        {features.map((feature) => {
          const [longitude, latitude] = feature.geometry.coordinates;
          if ("cluster" in feature.properties && feature.properties.cluster) {
            const clusterId = feature.properties.cluster_id;
            return (
              <Marker
                key={`cluster-${clusterId}-${feature.properties.point_count}`}
                coordinate={{ latitude, longitude }}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={tracksViewChanges}
                onPress={() => {
                  const zoom = Math.min(index.getClusterExpansionZoom(clusterId), CLUSTER_MAX_ZOOM + 1);
                  mapRef.current?.animateCamera({ center: { latitude, longitude }, zoom }, { duration: 450 });
                }}
              >
                <ClusterBubble count={feature.properties.point_count} />
              </Marker>
            );
          }
          const marker = markers[(feature.properties as { markerIndex: number }).markerIndex];
          return (
            <Marker
              key={marker.id}
              coordinate={marker.coordinate}
              title={marker.title}
              anchor={{ x: 0.5, y: 1 }}
              tracksViewChanges={tracksViewChanges}
              onPress={marker.onPress}
            >
              <CategoryPin kind={marker.kind ?? "restaurant"} />
            </Marker>
          );
        })}
        {routeCoordinates.length > 1 && <Polyline coordinates={routeCoordinates} strokeColor="#2563eb" strokeWidth={5} lineCap="round" lineJoin="round" />}
      </MapView>
    </View>
  );
});

export default NativeGoogleMap;

const styles = StyleSheet.create({
  container: { width: "100%", height: "100%", overflow: "hidden", backgroundColor: "#dbeafe" },
  pinWrap: { width: 48, height: 54, alignItems: "center", justifyContent: "flex-end", paddingBottom: 2 },
  clusterBox: { alignItems: "center", justifyContent: "center" },
  pin: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "#ffffff", elevation: 4, shadowColor: "#0f172a", shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  pinTail: { width: 0, height: 0, marginTop: -2, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8, borderLeftColor: "transparent", borderRightColor: "transparent" },
  cluster: { alignItems: "center", justifyContent: "center", backgroundColor: "rgba(239, 68, 68, 0.55)", borderWidth: 2, borderColor: "rgba(185, 28, 28, 0.85)" },
  clusterText: { color: "#1f2937", fontSize: 15, fontWeight: "800" },
});
