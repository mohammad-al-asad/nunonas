import React from "react";
import { StyleSheet, View } from "react-native";
import type { GeoCoordinates } from "../../../../../lib/event-map-types";
import NativeMapboxMap from "../../../../ui/NativeMapboxMap";

type Props = { center: GeoCoordinates | null };

export default function HotelOverviewMap({ center }: Props) {
  if (!center) return null;
  return (
    <View style={styles.container}>
      <NativeMapboxMap
        center={center}
        height={180}
        zoomLevel={14}
        showUserLocation={false}
        markers={[{ id: "hotel", kind: "hotel", coordinate: center, children: null, title: "Hotel location" }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 180, borderRadius: 16, overflow: "hidden", marginBottom: 12 },
});
