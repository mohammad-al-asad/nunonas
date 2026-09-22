import type { ImageSourcePropType } from "react-native";

export type ProviderPayload = {
  id?: string | number | null;
  _id?: string | number | null;
  title?: string | null;
  name?: string | null;
  rating?: number | string | null;
  reviews?: number | string | null;
  reviews_count?: number | string | null;
  category?: string | null;
  cuisine?: string | null;
  type?: string | null;
  price?: number | string | null;
  price_range?: string | null;
  priceRange?: string | null;
  distance?: string | null;
  distance_km?: number | string | null;
  is_open_now?: boolean | null;
  offer_text?: string | null;
  near_metro?: boolean | null;
  metro_station?: string | null;
  nearest_metro_station?: string | null;
  location?: string | null;
  address?: string | null;
  city?: string | null;
  profile_image_url?: string | null;
  cover_image_url?: string | null;
  image_url?: string | null;
  asset_url?: string | null;
  image?: string | null;
  url?: string | null;
  description?: string | null;
  about?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  status?: string | null;
  amenities?: string[] | null;
  offers?: ProviderOffer[] | null;
  seating_preferences?: string[] | null;
  policy?: string | null;
  booking_policy?: string | null;
  opening_hours?: { open_time?: string | null; close_time?: string | null; is_open_now?: boolean; available_times?: string[] } | null;
  service_name?: string | null;
  service_type?: string | null;
  duration?: number | string | null;
  duration_minutes?: number | string | null;
  active_status?: boolean | null;
  available?: boolean | null;
  phone?: string | null;
  contact?: { phone?: string | null; email?: string | null; reservations_email?: string | null } | null;
};

export type ProviderOffer = {
  id?: string | number | null;
  title?: string | null;
  promotion_name?: string | null;
  description?: string | null;
  internal_description?: string | null;
  offer_text?: string | null;
  active?: boolean | null;
};

export type ProviderCollectionResponse<TItem = ProviderPayload> = {
  items?: TItem[];
  total?: number;
};

export type NormalizedRestaurant = {
  id: string;
  title: string;
  ratingText: string;
  reviewsText: string;
  reviewsCount: number;
  category: string;
  priceRange: string;
  distanceText: string;
  locationText: string;
  profileImageUrl: string;
  imageUrl: string;
  description: string;
  amenities: string[];
  seatingPreferences: string[];
  bookingPolicy: string;
  phone?: string;
  latitude?: number | null;
  longitude?: number | null;
  openingHours?: { open_time?: string | null; close_time?: string | null; is_open_now?: boolean; available_times?: string[] };
};

export type NormalizedHotel = {
  id: string;
  title: string;
  ratingText: string;
  reviewsText: string;
  reviewsCount: number;
  priceText: string;
  priceRange: string;
  locationText: string;
  profileImageUrl: string;
  imageUrl: string;
  statusText: string;
  description: string;
  about: string;
  address: string;
  location: string;
  amenities: string[];
  offers: ProviderOffer[];
  phone?: string;
  latitude?: number | null;
  longitude?: number | null;
  openingHours?: { open_time?: string | null; close_time?: string | null; is_open_now?: boolean };
  distanceKm?: number | null;
};

export type NormalizedSpa = {
  id: string;
  title: string;
  ratingText: string;
  reviewsText: string;
  reviewsCount: number;
  category: string;
  typeText: string;
  distanceText: string;
  locationText: string;
  profileImageUrl: string;
  imageUrl: string;
  description: string;
  amenities: string[];
  phone?: string;
  latitude?: number | null;
  longitude?: number | null;
  openingHours?: { open_time?: string | null; close_time?: string | null; is_open_now?: boolean };
};

export type ProviderImageSource = ImageSourcePropType;
