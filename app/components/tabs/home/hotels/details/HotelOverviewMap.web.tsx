import React from "react";
import { StyleSheet, View } from "react-native";
import MapboxWebMap from "../../../../ui/MapboxWebMap";
import type { GeoCoordinates } from "../../../../../lib/event-map-types";

type Props = { center: GeoCoordinates | null };

export default function HotelOverviewMap({ center }: Props) {
  if (!center) return null;
  return <View style={styles.container}><MapboxWebMap center={center} height={180} zoomLevel={14} markers={[{ id: "hotel", title: "Hotel location", latitude: center.latitude, longitude: center.longitude, kind: "hotel" }]} showCenterMarker={false} /></View>;
}

const styles = StyleSheet.create({ container: { height: 180, borderRadius: 16, overflow: "hidden", marginBottom: 12 } });
