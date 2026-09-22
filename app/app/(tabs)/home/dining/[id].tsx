import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Text,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import theme from "../../../../constants/theme";
import { getFirstQueryParam } from "../../../../lib/event-map-utils";
import { normalizeRestaurant, getErrorMessage } from "../../../../lib/provider-utils";
import type { ProviderCollectionResponse, ProviderPayload, NormalizedRestaurant } from "../../../../lib/provider-types";

// Import Details Components
import ImageHeader from "../../../../components/tabs/home/dining/details/ImageHeader";
import DetailsInfo from "../../../../components/tabs/home/dining/details/DetailsInfo";
import DetailsActions from "../../../../components/tabs/home/dining/details/DetailsActions";
import DetailsTabs from "../../../../components/tabs/home/dining/details/DetailsTabs";
import OverviewContent from "../../../../components/tabs/home/dining/details/OverviewContent";
import MenuContent from "../../../../components/tabs/home/dining/details/MenuContent";
import GalleryContent from "../../../../components/tabs/home/dining/details/GalleryContent";
import ReviewsContent from "../../../../components/tabs/home/reviews/ReviewsContent";

import {
  getRestaurant,
  getRestaurantMenu,
  getRestaurantGallery,
  getRestaurantOffers,
} from "../../../../lib/customer-api";

export default function RestaurantDetailsScreen() {
  const { id } = useLocalSearchParams();
  const restaurantId = getFirstQueryParam(id);
  const [activeTab, setActiveTab] = useState("Overview");

  const [restaurant, setRestaurant] = useState<NormalizedRestaurant | null>(null);
  const [menuItems, setMenuItems] = useState<ProviderPayload[]>([]);
  const [galleryItems, setGalleryItems] = useState<ProviderPayload[]>([]);
  const [offers, setOffers] = useState<ProviderPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    if (!restaurantId) {
      setRestaurant(null);
      setError("Restaurant not found.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [detail, menu, gallery, offerData] = await Promise.allSettled([
        getRestaurant<ProviderPayload>(restaurantId),
        getRestaurantMenu<ProviderCollectionResponse>(restaurantId),
        getRestaurantGallery<ProviderCollectionResponse>(restaurantId),
        getRestaurantOffers<ProviderCollectionResponse>(restaurantId),
      ]);

      if (detail.status === "fulfilled") setRestaurant(normalizeRestaurant(detail.value));
      else setError("Restaurant not found.");

      if (menu.status === "fulfilled") setMenuItems(menu.value?.items ?? []);
      if (gallery.status === "fulfilled") setGalleryItems(gallery.value?.items ?? []);
      if (offerData.status === "fulfilled") setOffers(offerData.value?.items ?? []);
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Failed to load restaurant."));
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.COLORS.primary} />
      </View>
    );
  }

  if (error || !restaurant) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? "Restaurant not found."}</Text>
      </View>
    );
  }

  const galleryImageUris = galleryItems
    .map((item) => item.asset_url ?? item.image_url ?? item.cover_image_url ?? item.image ?? item.url)
    .filter((uri): uri is string => Boolean(uri));

  const firstGalleryImage = galleryImageUris[0];

  const coverImage = firstGalleryImage
    ? { uri: firstGalleryImage }
    : restaurant.imageUrl
      ? { uri: restaurant.imageUrl }
      : require("../../../../assets/images/discover-experience.png");

  const rawHeaderImages = [
    ...(firstGalleryImage ? [{ uri: firstGalleryImage }] : []),
    ...(restaurant.imageUrl ? [{ uri: restaurant.imageUrl }] : []),
    ...galleryImageUris.map((uri) => ({ uri })),
  ];

  const headerImages = rawHeaderImages.length
    ? rawHeaderImages.filter((item, index, all) => index === all.findIndex((candidate) => candidate.uri === item.uri))
    : [coverImage];

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[3]}>
        <ImageHeader image={coverImage} images={headerImages} entityId={restaurantId} />
        <DetailsInfo restaurant={restaurant} offers={offers} />
        <DetailsActions
          restaurantId={restaurantId}
          phone={restaurant.phone}
          latitude={restaurant.latitude}
          longitude={restaurant.longitude}
          title={restaurant.title}
          address={restaurant.locationText}
        />
        <DetailsTabs activeTab={activeTab} onTabPress={setActiveTab} />

        {/* Tab Content */}
        <View style={styles.content}>
          {activeTab === "Overview" && <OverviewContent restaurant={restaurant} />}
          {activeTab === "Menu" && <MenuContent items={menuItems} />}
          {activeTab === "Gallery" && <GalleryContent items={galleryItems} />}
          {activeTab === "Reviews" && restaurantId ? <ReviewsContent restaurantId={restaurantId} providerType="restaurant" /> : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.white,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.COLORS.white,
  },
  errorText: {
    fontSize: 16,
    color: theme.COLORS.error,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  content: {
    backgroundColor: theme.COLORS.white,
    paddingBottom: 40,
  },
});


