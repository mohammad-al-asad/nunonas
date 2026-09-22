"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { useToast } from "@/components/ui/ToastProvider";
import { Bell, CalendarPlus2, BadgePercent, Save, Shield, User, X, Hotel, ImagePlus, Utensils, Sparkles, Plus } from "lucide-react";
import {
  vendorCreateEvent,
  vendorAddServiceAmenity,
  vendorGetProfileSettings,
  vendorUpdateNotificationSettings,
  vendorUpdatePassword,
  vendorUpdateProfileSettings,
  uploadVendorFile,
  type VendorEventPayload,
  type VendorEventStatus,
} from "@/lib/vendor-api";
import { extractVendorCategories, type VendorCategory } from "@/lib/vendor-access";
import {
  EVENT_CATEGORY_OPTIONS,
  type EventDiscoveryCategory,
} from "@/lib/event-categories";
import { vendorQueryKeys } from "@/lib/vendor-queries";
import {
  loadGoogleMaps,
  toGoogleLatLngLiteral,
  type GoogleAdvancedMarkerInstance,
  type GoogleGeocoderResult,
  type GoogleMapInstance,
  type GoogleMapMouseEvent,
  type ReadyGoogleMaps,
} from "@/lib/google-maps";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const GOOGLE_MAPS_MAP_ID =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

type SettingsTab = "profile" | "notifications" | "security";
type ServiceType = "restaurant" | "hotel" | "spa" | "event" | "happy_hour";

type ServiceOffer = {
  title: string;
  description: string;
  active: boolean;
};

type EventFormState = {
  title: string;
  eventType: EventDiscoveryCategory;
  eventDate: string;
  eventEndDate: string;
  startTime: string;
  endTime: string;
  timezone: string;
  venue: string;
  capacity: string;
  ticketPrice: string;
  registrationDeadline: string;
  description: string;
  bannerImageUrl: string;
  status: VendorEventStatus;
};

export type SettingsProfileData = {
  business_name?: string;
  name?: string;
  category?: string;
  categories?: string[];
  phone_number?: string;
  phone?: string;
  email_address?: string;
  email?: string;
  office_address?: string;
  address?: string;
  about_business?: string;
  description?: string;
  owner_full_name?: string;
  website?: string;
  location_label?: string;
  latitude?: number | null;
  longitude?: number | null;
  restaurant_settings?: Record<string, any>;
  hotel_settings?: Record<string, any>;
  spa_settings?: Record<string, any>;
  event_settings?: Record<string, any>;
  happy_hour_settings?: Record<string, any>;
};

export type SettingsNotificationData = {
  new_booking?: boolean;
  booking_cancellation?: boolean;
  new_review?: boolean;
  platform_updates?: boolean;
};

const DEFAULT_CATEGORIES: VendorCategory[] = ["Restaurant"];
// Events and Happy Hours have dedicated management pages and are not
// configurable from Service-specific settings.
const SERVICE_TYPES = ["restaurant", "hotel", "spa"] as const;
const SERVICE_CATEGORY_NAMES: Record<ServiceType, VendorCategory> = {
  restaurant: "Restaurant",
  hotel: "Hotel",
  spa: "Spa",
  event: "Event",
  happy_hour: "Happy Hour",
};

function getDefaultEventForm(): EventFormState {
  return {
    title: "",
    eventType: "Music",
    eventDate: "",
    eventEndDate: "",
    startTime: "",
    endTime: "",
    timezone: "Asia/Dhaka",
    venue: "",
    capacity: "",
    ticketPrice: "",
    registrationDeadline: "",
    description: "",
    bannerImageUrl: "",
    status: "draft",
  };
}

const SERVICE_HOURS = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"));
const SERVICE_MINUTES = ["00", "15", "30", "45"];
const SERVICE_PERIODS = ["AM", "PM"];
const BOOKING_TIME_OPTIONS = Array.from({ length: 96 }, (_, index) => {
  const hour24 = Math.floor(index / 4);
  const minute = SERVICE_MINUTES[index % 4];
  const hour12 = String(hour24 % 12 || 12).padStart(2, "0");
  return `${hour12}:${minute} ${hour24 < 12 ? "AM" : "PM"}`;
});
const SERVICE_AMENITY_OPTIONS = {
  restaurant: ["Free WiFi", "Parking", "Air Conditioning", "Outdoor Seating", "Wheelchair Accessible", "Private Dining", "Family Friendly"],
  hotel: ["Free WiFi", "Parking", "Air Conditioning", "Swimming Pool", "Gym", "Smart TV", "Balcony", "Coffee Maker"],
  spa: ["Free WiFi", "Parking", "Air Conditioning", "Sauna", "Steam Room", "Changing Room", "Showers", "Relaxation Lounge"],
  event: ["Parking", "Accessible", "Family Friendly", "Food Available", "Live Music", "Security"],
  happy_hour: ["Parking", "Outdoor Seating", "Live Music", "Food Available", "Reservations", "Accessible"],
} satisfies Record<ServiceType, string[]>;
const SEATING_PREFERENCE_OPTIONS = ["Indoor", "Outdoor", "Window", "Booth", "Bar", "Private Dining", "No preference"];

function splitServiceTime(value: string) {
  const match = String(value || "").match(/^(?:(\d{1,2})(?::(\d{2}))?)(?:\s*(AM|PM))?$/i);
  return { hour: match?.[1]?.padStart(2, "0") ?? "", minute: match?.[2] ?? "", period: match?.[3]?.toUpperCase() ?? "" };
}

function setServiceTimePart(value: string, part: "hour" | "minute" | "period", next: string) {
  const current = splitServiceTime(value);
  const updated = { ...current, [part]: next };
  if (!updated.hour) return "";
  if (!updated.minute) return updated.hour;
  return `${updated.hour}:${updated.minute}${updated.period ? ` ${updated.period}` : ""}`;
}

function normalizeServiceOffers(value: unknown): ServiceOffer[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (offer): offer is Record<string, unknown> =>
        Boolean(offer) && typeof offer === "object",
    )
    .map((offer) => ({
      title: String(offer.title ?? ""),
      description: String(offer.description ?? ""),
      active: offer.active !== false,
    }));
}

function validateEventForm(form: EventFormState): string | null {
  if (!form.title.trim()) return "Event title is required.";
  if (!EVENT_CATEGORY_OPTIONS.includes(form.eventType)) {
    return "Select a valid event category.";
  }
  if (!form.eventDate) return "Event start date is required.";
  if (!form.eventEndDate) return "Event end date is required.";
  if (form.eventEndDate < form.eventDate) {
    return "Event end date cannot be earlier than the start date.";
  }
  if (!form.startTime) return "Start time is required.";
  if (!form.endTime) return "End time is required.";
  if (form.eventEndDate === form.eventDate && form.endTime <= form.startTime) {
    return "End time must be later than start time for a one-day event.";
  }
  if (!form.venue.trim()) return "Location is required.";
  if (!form.capacity.trim() || Number(form.capacity) <= 0) return "Capacity must be greater than zero.";
  if (!form.ticketPrice.trim() || Number(form.ticketPrice) < 0) return "Ticket price must be zero or more.";
  if (!form.description.trim()) return "Description is required.";
  return null;
}

function toEventPayload(form: EventFormState): VendorEventPayload {
  return {
    title: form.title.trim(),
    event_type: form.eventType,
    event_date: form.eventDate,
    end_date: form.eventEndDate,
    start_time: form.startTime,
    end_time: form.endTime,
    timezone: form.timezone.trim() || "Asia/Dhaka",
    venue: form.venue.trim(),
    capacity: Number(form.capacity),
    ticket_price: Number(form.ticketPrice),
    registration_deadline: form.registrationDeadline || null,
    description: form.description.trim(),
    banner_image_url: form.bannerImageUrl.trim() || null,
    active_status: true,
    status: form.status,
  };
}

export function SettingsPageClient({
  initialProfile,
  initialNotifications,
}: {
  initialProfile: SettingsProfileData;
  initialNotifications: SettingsNotificationData;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [categories, setCategories] = useState<VendorCategory[]>(() => extractVendorCategories(initialProfile.categories ?? initialProfile.category));
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [eventSaving, setEventSaving] = useState(false);
  const [eventStatusMessage, setEventStatusMessage] = useState("");
  const [profileForm, setProfileForm] = useState({
    address: String(initialProfile.office_address ?? initialProfile.address ?? ""),
    description: String(initialProfile.about_business ?? initialProfile.description ?? ""),
    location_label: String(initialProfile.location_label ?? ""),
    website: String(initialProfile.website ?? ""),
  });
  const [serviceTab, setServiceTab] = useState<ServiceType>("restaurant");
  const [serviceImageUploading, setServiceImageUploading] = useState<ServiceType | null>(null);
  const [serviceSettings, setServiceSettings] = useState({
    restaurant: { name: initialProfile.restaurant_settings?.name ?? "", profile_image_url: initialProfile.restaurant_settings?.profile_image_url ?? "", address: initialProfile.restaurant_settings?.address ?? "", city: initialProfile.restaurant_settings?.city ?? "", phone: initialProfile.restaurant_settings?.phone ?? "", email: initialProfile.restaurant_settings?.email ?? "", latitude: initialProfile.restaurant_settings?.latitude ?? "", longitude: initialProfile.restaurant_settings?.longitude ?? "", about: initialProfile.restaurant_settings?.about ?? "", opening_time: initialProfile.restaurant_settings?.opening_time ?? "", closing_time: initialProfile.restaurant_settings?.closing_time ?? "", available_booking_times: initialProfile.restaurant_settings?.available_booking_times ?? [], seating_preferences: initialProfile.restaurant_settings?.seating_preferences ?? ["Indoor", "Outdoor", "No preference"], policy: initialProfile.restaurant_settings?.policy ?? "", amenities: initialProfile.restaurant_settings?.amenities ?? [], special_offers: initialProfile.restaurant_settings?.special_offers ?? [], published: initialProfile.restaurant_settings?.published !== false },
    hotel: { name: initialProfile.hotel_settings?.name ?? "", profile_image_url: initialProfile.hotel_settings?.profile_image_url ?? "", address: initialProfile.hotel_settings?.address ?? "", city: initialProfile.hotel_settings?.city ?? "", phone: initialProfile.hotel_settings?.phone ?? "", email: initialProfile.hotel_settings?.email ?? "", latitude: initialProfile.hotel_settings?.latitude ?? "", longitude: initialProfile.hotel_settings?.longitude ?? "", about: initialProfile.hotel_settings?.about ?? "", opening_time: initialProfile.hotel_settings?.opening_time ?? "", closing_time: initialProfile.hotel_settings?.closing_time ?? "", policy: initialProfile.hotel_settings?.policy ?? "", amenities: initialProfile.hotel_settings?.amenities ?? [], special_offers: initialProfile.hotel_settings?.special_offers ?? [], published: initialProfile.hotel_settings?.published !== false },
    spa: { name: initialProfile.spa_settings?.name ?? "", profile_image_url: initialProfile.spa_settings?.profile_image_url ?? "", address: initialProfile.spa_settings?.address ?? "", city: initialProfile.spa_settings?.city ?? "", phone: initialProfile.spa_settings?.phone ?? "", email: initialProfile.spa_settings?.email ?? "", latitude: initialProfile.spa_settings?.latitude ?? "", longitude: initialProfile.spa_settings?.longitude ?? "", about: initialProfile.spa_settings?.about ?? "", opening_time: initialProfile.spa_settings?.opening_time ?? "", closing_time: initialProfile.spa_settings?.closing_time ?? "", policy: initialProfile.spa_settings?.policy ?? "", amenities: initialProfile.spa_settings?.amenities ?? [], special_offers: initialProfile.spa_settings?.special_offers ?? [], published: initialProfile.spa_settings?.published !== false },
    event: { name: initialProfile.event_settings?.name ?? "", profile_image_url: initialProfile.event_settings?.profile_image_url ?? "", address: initialProfile.event_settings?.address ?? "", city: initialProfile.event_settings?.city ?? "", phone: initialProfile.event_settings?.phone ?? "", email: initialProfile.event_settings?.email ?? "", latitude: initialProfile.event_settings?.latitude ?? "", longitude: initialProfile.event_settings?.longitude ?? "", about: initialProfile.event_settings?.about ?? "", opening_time: initialProfile.event_settings?.opening_time ?? "", closing_time: initialProfile.event_settings?.closing_time ?? "", policy: initialProfile.event_settings?.policy ?? "", amenities: initialProfile.event_settings?.amenities ?? [], special_offers: initialProfile.event_settings?.special_offers ?? [], published: initialProfile.event_settings?.published !== false },
    happy_hour: { name: initialProfile.happy_hour_settings?.name ?? "", profile_image_url: initialProfile.happy_hour_settings?.profile_image_url ?? "", address: initialProfile.happy_hour_settings?.address ?? "", city: initialProfile.happy_hour_settings?.city ?? "", phone: initialProfile.happy_hour_settings?.phone ?? "", email: initialProfile.happy_hour_settings?.email ?? "", latitude: initialProfile.happy_hour_settings?.latitude ?? "", longitude: initialProfile.happy_hour_settings?.longitude ?? "", about: initialProfile.happy_hour_settings?.about ?? "", opening_time: initialProfile.happy_hour_settings?.opening_time ?? "", closing_time: initialProfile.happy_hour_settings?.closing_time ?? "", policy: initialProfile.happy_hour_settings?.policy ?? "", amenities: initialProfile.happy_hour_settings?.amenities ?? [], special_offers: initialProfile.happy_hour_settings?.special_offers ?? [], published: initialProfile.happy_hour_settings?.published !== false },
  });
  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [notifForm, setNotifForm] = useState({
    new_booking: Boolean(initialNotifications.new_booking ?? true),
    booking_cancellation: Boolean(initialNotifications.booking_cancellation ?? true),
    new_review: Boolean(initialNotifications.new_review ?? true),
    platform_updates: Boolean(initialNotifications.platform_updates ?? false),
  });
  const [eventForm, setEventForm] = useState<EventFormState>(getDefaultEventForm());
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const locationMapRef = useRef<HTMLDivElement>(null);
  const locationMapInstance = useRef<GoogleMapInstance | null>(null);
  const locationMarkerInstance = useRef<GoogleAdvancedMarkerInstance | null>(null);
  const [locationMapOpen, setLocationMapOpen] = useState(false);
  const [locationMapError, setLocationMapError] = useState("");
  const serviceSettingsRef = useRef(serviceSettings);
  const configuredCategories = categories.length
    ? categories
    : extractVendorCategories(initialProfile.categories ?? initialProfile.category);
  const visibleServiceTabs = SERVICE_TYPES.filter((service) =>
    configuredCategories.includes(SERVICE_CATEGORY_NAMES[service]),
  );
  const activeServiceTab = (visibleServiceTabs.includes(serviceTab as (typeof visibleServiceTabs)[number])
    ? serviceTab
    : visibleServiceTabs[0]) as "restaurant" | "hotel" | "spa";
  const activeServiceOffers = normalizeServiceOffers(
    serviceSettings[activeServiceTab].special_offers,
  );
  const setActiveServiceOffers = (special_offers: ServiceOffer[]) => {
    setServiceSettings((current) => ({
      ...current,
      [activeServiceTab]: {
        ...current[activeServiceTab],
        special_offers,
      },
    }));
  };

  useEffect(() => {
    serviceSettingsRef.current = serviceSettings;
  }, [serviceSettings]);

  useEffect(() => {
    if (!locationMapOpen || !locationMapRef.current || !GOOGLE_MAPS_API_KEY) return;
    setLocationMapError("");
    let cancelled = false;
    let googleMaps: ReadyGoogleMaps | undefined;
    const initialize = (readyMaps: ReadyGoogleMaps) => {
      if (cancelled || !locationMapRef.current) return;
      googleMaps = readyMaps;
      const current = serviceSettingsRef.current[activeServiceTab];
      const center = { lat: Number(current.latitude) || 23.8103, lng: Number(current.longitude) || 90.4125 };
      const map = new readyMaps.Map(locationMapRef.current, {
        center,
        zoom: 14,
        mapId: GOOGLE_MAPS_MAP_ID,
        mapTypeControl: false,
      });
      const marker = new readyMaps.AdvancedMarkerElement({
        position: center,
        map,
        gmpDraggable: true,
      });
      const geocoder = new readyMaps.Geocoder();
      const update = (lat: number, lng: number) => {
        geocoder.geocode({ location: { lat, lng } }, (results: GoogleGeocoderResult[] | null, status: string) => {
          if (cancelled) return;
          const address = status === "OK" && results?.[0]?.formatted_address
            ? results[0].formatted_address
            : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          setServiceSettings((state) => ({ ...state, [activeServiceTab]: { ...state[activeServiceTab], latitude: String(lat), longitude: String(lng), address } }));
          setProfileForm((current) => ({ ...current, location_label: address }));
        });
      };
      map.addListener("click", (event: GoogleMapMouseEvent) => {
        if (!event.latLng) return;
        const position = toGoogleLatLngLiteral(event.latLng);
        if (!position) return;
        marker.position = position;
        update(position.lat, position.lng);
      });
      marker.addListener("dragend", () => {
        const position = toGoogleLatLngLiteral(marker.position);
        if (position) update(position.lat, position.lng);
      });
      locationMapInstance.current = map;
      locationMarkerInstance.current = marker;
    };
    void loadGoogleMaps(GOOGLE_MAPS_API_KEY)
      .then(initialize)
      .catch((error) => {
        if (!cancelled) {
          const message = error instanceof Error
            ? error.message
            : "Google Maps could not be initialized.";
          setLocationMapError(message);
          toast(
            message,
            "error",
          );
        }
      });
    return () => {
      cancelled = true;
      if (googleMaps?.event && locationMapInstance.current) {
        googleMaps.event.clearInstanceListeners(locationMapInstance.current);
      }
      if (googleMaps?.event && locationMarkerInstance.current) {
        googleMaps.event.clearInstanceListeners(locationMarkerInstance.current);
      }
      if (locationMarkerInstance.current) {
        locationMarkerInstance.current.map = null;
      }
      locationMapInstance.current = null;
      locationMarkerInstance.current = null;
    };
  }, [locationMapOpen, activeServiceTab, toast]);

  const ensureCategoriesLoaded = async () => {
    if (categoriesLoaded) {
      return;
    }

    try {
      const profile = await vendorGetProfileSettings();
      const nextCategories = extractVendorCategories(profile.categories ?? profile.category);
      setCategories(nextCategories);
    } catch {
      setCategories(DEFAULT_CATEGORIES);
    } finally {
      setCategoriesLoaded(true);
    }
  };

  useEffect(() => {
    void ensureCategoriesLoaded();
    const handleCategoriesUpdated = (event: Event) => {
      const detail = (event as CustomEvent<unknown>).detail;
      setCategories(extractVendorCategories(detail));
      setCategoriesLoaded(true);
    };
    window.addEventListener("vendor-categories-updated", handleCategoriesUpdated);
    return () => window.removeEventListener("vendor-categories-updated", handleCategoriesUpdated);
  }, []);

  const handleServiceProfileImageUpload = async (file: File | null) => {
    if (!file) {
      return;
    }
    const serviceType = activeServiceTab;
    setServiceImageUploading(serviceType);
    try {
      const url = await uploadVendorFile(file);
      if (!url) {
        throw new Error("The image upload did not return a URL.");
      }
      setServiceSettings((current) => ({
        ...current,
        [serviceType]: {
          ...current[serviceType],
          profile_image_url: url,
        },
      }));
      toast(
        `${serviceType.charAt(0).toUpperCase()}${serviceType.slice(1)} profile image uploaded. Save changes to publish it.`,
        "success",
      );
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Failed to upload profile image.",
        "error",
      );
    } finally {
      setServiceImageUploading(null);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await queryClient.cancelQueries({ queryKey: vendorQueryKeys.profile });
      const updatedProfile = await vendorUpdateProfileSettings(
        {
          office_address: profileForm.address.trim() || null,
          about_business: profileForm.description.trim(),
          location_label: profileForm.location_label,
          website: profileForm.website.trim() || null,
          restaurant_settings: serviceSettings.restaurant,
          hotel_settings: serviceSettings.hotel,
          spa_settings: serviceSettings.spa,
        },
      );
      queryClient.setQueryData(vendorQueryKeys.profile, updatedProfile);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async () => {
    setPasswordError("");
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError("Passwords don't match.");
      return;
    }
    if (passwordForm.new_password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (!passwordForm.old_password.trim()) {
      setPasswordError("Enter your current password.");
      return;
    }
    try {
      setSaving(true);
      await vendorUpdatePassword({
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
        confirm_password: passwordForm.confirm_password,
      });
      setSaved(true);
      setPasswordForm({ old_password: "", new_password: "", confirm_password: "" });
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setPasswordError((err as Error).message ?? "Failed to update password.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setSaving(true);
      await vendorUpdateNotificationSettings(notifForm as Record<string, unknown>);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save notification settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  const closeCreateEventModal = () => {
    setShowCreateEventModal(false);
    setEventStatusMessage("");
    setEventForm(getDefaultEventForm());
  };

  const openCreateEventModal = () => {
    setShowCreateEventModal(true);
    setEventStatusMessage("");
    setEventForm(getDefaultEventForm());
    void ensureCategoriesLoaded();
  };

  const handleBannerUpload = async (file: File | null) => {
    if (!file) {
      return;
    }

    try {
      setEventStatusMessage("Uploading banner image...");
      const url = await uploadVendorFile(file);
      setEventForm((current) => ({ ...current, bannerImageUrl: url }));
      setEventStatusMessage("Banner image uploaded.");
    } catch (error) {
      setEventStatusMessage(
        error instanceof Error ? error.message : "Failed to upload banner image.",
      );
    }
  };

  const handleCreateEvent = async () => {
    const validationError = validateEventForm(eventForm);
    if (validationError) {
      setEventStatusMessage(validationError);
      return;
    }

    setEventSaving(true);
    setEventStatusMessage("");
    try {
      await vendorCreateEvent(toEventPayload(eventForm));
      await queryClient.invalidateQueries({ queryKey: vendorQueryKeys.events() });
      setEventStatusMessage("Event created.");
      setTimeout(() => {
        closeCreateEventModal();
      }, 500);
    } catch (error) {
      setEventStatusMessage(
        error instanceof Error ? error.message : "Failed to create event.",
      );
    } finally {
      setEventSaving(false);
    }
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: "profile", label: "Business Settings", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Password & Security", icon: Shield },
  ];

  return (
    <div className="min-h-full bg-[#f8fafc] flex flex-col">
      <Header title="Settings" />

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="w-full space-y-7">
          <div className="flex gap-2 overflow-x-auto bg-white border border-slate-200 rounded-2xl p-2 shadow-sm">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex min-w-[170px] items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all flex-1 justify-center ${
                  activeTab === id
                    ? "bg-sky-500 text-white shadow"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-xl font-black text-slate-800 mb-1">Business Settings</h2>
                    <p className="text-sm text-slate-400">Manage public business details and service-specific customer information.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: "address", label: "Address", type: "text" },
                    { key: "location_label", label: "Public Location Label", type: "text" },
                    { key: "website", label: "Website", type: "url" },
                  ].map(({ key, label, type }) => (
                    <div key={key}>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">{label}</label>
                      <input
                        type={type}
                        value={profileForm[key as keyof typeof profileForm]}
                        onChange={(e) => setProfileForm((f) => ({ ...f, [key]: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-100 transition"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Description</label>
                  <textarea
                    value={profileForm.description}
                    onChange={(e) => setProfileForm((f) => ({ ...f, description: e.target.value }))}
                    rows={4}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-sky-400 resize-none transition"
                  />
                </div>
                {visibleServiceTabs.length ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-black text-slate-800">Service-specific settings</h3>
                      <p className="text-xs text-slate-500">These details are shown for the selected service type. New rooms and services inherit the saved business location above.</p>
                    </div>
                    <div className="flex gap-2 rounded-xl bg-white p-1">
                      {([
                        ["restaurant", "Restaurant", Utensils],
                        ["hotel", "Hotel", Hotel],
                        ["spa", "Spa", Sparkles],
                      ] as const).filter(([id]) => visibleServiceTabs.includes(id)).map(([id, label, Icon]) => (
                        <button key={id} type="button" onClick={() => setServiceTab(id)} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold ${activeServiceTab === id ? "bg-[#1e2a5e] text-white" : "text-slate-500 hover:bg-slate-100"}`}>
                          <Icon className="h-3.5 w-3.5" /> {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:col-span-2 sm:flex-row sm:items-center">
                      <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-4 border-slate-100 bg-slate-50">
                        {serviceSettings[activeServiceTab].profile_image_url ? (
                          <Image
                            src={serviceSettings[activeServiceTab].profile_image_url}
                            alt={`${activeServiceTab} profile`}
                            fill
                            sizes="96px"
                            unoptimized
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImagePlus className="h-8 w-8 text-slate-300" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-black capitalize text-slate-800">
                          {activeServiceTab} profile image
                        </h4>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Upload a square identity image for this service. It is shown separately from cover and gallery photos in the Activity Planner app.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#1e2a5e] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#263675]">
                            <ImagePlus className="h-4 w-4" />
                            {serviceImageUploading === activeServiceTab
                              ? "Uploading…"
                              : serviceSettings[activeServiceTab].profile_image_url
                                ? "Replace image"
                                : "Upload image"}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={serviceImageUploading !== null}
                              onChange={(event) => {
                                const file = event.target.files?.[0] ?? null;
                                event.target.value = "";
                                void handleServiceProfileImageUpload(file);
                              }}
                            />
                          </label>
                          {serviceSettings[activeServiceTab].profile_image_url ? (
                            <button
                              type="button"
                              onClick={() =>
                                setServiceSettings((current) => ({
                                  ...current,
                                  [activeServiceTab]: {
                                    ...current[activeServiceTab],
                                    profile_image_url: "",
                                  },
                                }))
                              }
                              className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-2.5 text-xs font-black text-rose-600 transition hover:bg-rose-100"
                            >
                              Remove
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <label className="inline-flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 md:col-span-2"><input type="checkbox" checked={serviceSettings[activeServiceTab].published} onChange={(e) => setServiceSettings((current) => ({ ...current, [activeServiceTab]: { ...current[activeServiceTab], published: e.target.checked } }))} className="h-4 w-4 accent-emerald-600" />Publish this {activeServiceTab} to customers</label>
                    {(["name", "city", "phone", "email"] as const).map((field) => (
                      <label key={field} className="block"><span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">{field.replace("_", " ")}</span><input value={serviceSettings[activeServiceTab][field]} onChange={(e) => setServiceSettings((current) => ({ ...current, [activeServiceTab]: { ...current[activeServiceTab], [field]: e.target.value } }))} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-400" placeholder={`Enter ${field.replace("_", " ")}`} /></label>
                    ))}
                    <div className="md:col-span-2"><span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Location</span><div className="flex flex-wrap items-center gap-3"><input readOnly value={serviceSettings[activeServiceTab].address} placeholder="Choose this service location from the map" className="min-w-[240px] flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600" /><button type="button" onClick={() => { setLocationMapError(""); setLocationMapOpen(true); }} className="rounded-xl bg-[#1e2a5e] px-4 py-3 text-sm font-bold text-white">Choose on map</button></div></div>
                    <label className="block md:col-span-2"><span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">About this {activeServiceTab}</span><textarea rows={3} value={serviceSettings[activeServiceTab].about} onChange={(e) => setServiceSettings((current) => ({ ...current, [activeServiceTab]: { ...current[activeServiceTab], about: e.target.value } }))} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-400" placeholder={`Describe your ${activeServiceTab} offering`} /></label>
                    <div className="md:col-span-2">
                      <OptionChipEditor
                        label="Amenities"
                        values={serviceSettings[activeServiceTab].amenities}
                        suggestions={SERVICE_AMENITY_OPTIONS[activeServiceTab]}
                        addLabel="Add custom amenity"
                        inputPlaceholder="Enter an amenity"
                        emptyMessage="No amenities selected yet."
                        onAddCustom={async (amenity) => {
                          const serviceType = activeServiceTab;
                          const result = await vendorAddServiceAmenity(serviceType, amenity);
                          setServiceSettings((current) => ({
                            ...current,
                            [serviceType]: {
                              ...current[serviceType],
                              amenities: result.amenities,
                            },
                          }));
                          toast(
                            result.created
                              ? `${result.amenity} was added to ${serviceType} amenities.`
                              : `${result.amenity} is already in ${serviceType} amenities.`,
                            "success",
                          );
                        }}
                        onChange={(amenities) => setServiceSettings((current) => ({
                          ...current,
                          [activeServiceTab]: { ...current[activeServiceTab], amenities },
                        }))}
                      />
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 md:col-span-2 sm:p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-black text-slate-800">
                            Special offers
                          </h4>
                          <p className="mt-1 text-xs text-slate-500">
                            Manage offers shown on this {activeServiceTab} listing.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveServiceOffers([
                              ...activeServiceOffers,
                              { title: "", description: "", active: true },
                            ])
                          }
                          className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-black text-[#1e2a5e] transition hover:bg-slate-200"
                        >
                          <Plus className="h-4 w-4" />
                          Add offer
                        </button>
                      </div>

                      <div className="mt-4 space-y-3">
                        {activeServiceOffers.length ? (
                          activeServiceOffers.map((offer, index) => (
                            <div
                              key={`${activeServiceTab}-offer-${index}`}
                              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                            >
                              <div className="flex items-start gap-3">
                                <div className="min-w-0 flex-1 space-y-3">
                                  <input
                                    value={offer.title}
                                    onChange={(event) =>
                                      setActiveServiceOffers(
                                        activeServiceOffers.map((item, offerIndex) =>
                                          offerIndex === index
                                            ? { ...item, title: event.target.value }
                                            : item,
                                        ),
                                      )
                                    }
                                    maxLength={120}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-sky-400"
                                    placeholder="Offer title"
                                  />
                                  <textarea
                                    value={offer.description}
                                    onChange={(event) =>
                                      setActiveServiceOffers(
                                        activeServiceOffers.map((item, offerIndex) =>
                                          offerIndex === index
                                            ? {
                                                ...item,
                                                description: event.target.value,
                                              }
                                            : item,
                                        ),
                                      )
                                    }
                                    rows={2}
                                    maxLength={500}
                                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 outline-none focus:border-sky-400"
                                    placeholder="Describe the offer"
                                  />
                                  <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-500">
                                    <input
                                      type="checkbox"
                                      checked={offer.active}
                                      onChange={(event) =>
                                        setActiveServiceOffers(
                                          activeServiceOffers.map((item, offerIndex) =>
                                            offerIndex === index
                                              ? { ...item, active: event.target.checked }
                                              : item,
                                          ),
                                        )
                                      }
                                      className="h-4 w-4 accent-sky-500"
                                    />
                                    Show this offer in the customer app
                                  </label>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveServiceOffers(
                                      activeServiceOffers.filter(
                                        (_, offerIndex) => offerIndex !== index,
                                      ),
                                    )
                                  }
                                  aria-label={`Remove offer ${index + 1}`}
                                  className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-xs font-semibold text-slate-400">
                            No special offers added.
                          </p>
                        )}
                      </div>
                    </div>
                    <TimeSelects label="Open time" value={serviceSettings[activeServiceTab].opening_time} onChange={(value) => setServiceSettings((current) => ({ ...current, [activeServiceTab]: { ...current[activeServiceTab], opening_time: value } }))} />
                    <TimeSelects label="Close time" value={serviceSettings[activeServiceTab].closing_time} onChange={(value) => setServiceSettings((current) => ({ ...current, [activeServiceTab]: { ...current[activeServiceTab], closing_time: value } }))} />
                    {activeServiceTab === "restaurant" ? (
                      <div className="md:col-span-2">
                        <BookingTimesEditor
                          values={serviceSettings.restaurant.available_booking_times}
                          onChange={(available_booking_times) => setServiceSettings((current) => ({
                            ...current,
                            restaurant: { ...current.restaurant, available_booking_times },
                          }))}
                        />
                      </div>
                    ) : null}
                    {activeServiceTab === "restaurant" ? (
                      <div className="md:col-span-2">
                        <OptionChipEditor
                          label="Seating preferences"
                          values={serviceSettings.restaurant.seating_preferences}
                          suggestions={SEATING_PREFERENCE_OPTIONS}
                          addLabel="Add custom seating"
                          inputPlaceholder="Enter a seating preference"
                          emptyMessage="No seating preferences selected yet."
                          helpText="Only these seating choices will be shown in the customer app."
                          onChange={(seating_preferences) => setServiceSettings((current) => ({
                            ...current,
                            restaurant: { ...current.restaurant, seating_preferences },
                          }))}
                        />
                      </div>
                    ) : null}
                    <label className="block"><span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Booking / cancellation policy</span><input value={serviceSettings[activeServiceTab].policy} onChange={(e) => setServiceSettings((current) => ({ ...current, [activeServiceTab]: { ...current[activeServiceTab], policy: e.target.value } }))} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-400" placeholder="Free cancellation up to 24 hours" /></label>
                  </div>
                </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
                    <h3 className="text-sm font-black text-slate-800">
                      No venue service selected
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Configure every service profile, location, image, offers,
                      and publish status from the tabs above. Use the dedicated
                      management pages to create and manage service records.
                    </p>
                  </div>
                )}
                <button
                  onClick={handleSaveProfile}
                  disabled={saving || serviceImageUploading !== null}
                  className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
                </button>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black text-slate-800 mb-1">Notification Preferences</h2>
                  <p className="text-sm text-slate-400">Choose which updates you want to receive.</p>
                </div>
                {[
                  { key: "new_booking", label: "New Bookings", description: "Alert when a new booking is made" },
                  { key: "booking_cancellation", label: "Booking Cancellations", description: "Alert when a booking is cancelled" },
                  { key: "new_review", label: "New Reviews", description: "Alert when a customer leaves a review" },
                  { key: "platform_updates", label: "Platform Updates", description: "News and product updates from Activity Planner" },
                ].map(({ key, label, description }) => (
                  <div key={key} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div>
                      <p className="text-sm font-bold text-slate-700">{label}</p>
                      <p className="text-xs text-slate-400">{description}</p>
                    </div>
                    <button
                      onClick={() => setNotifForm((f) => ({ ...f, [key]: !f[key as keyof typeof notifForm] }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notifForm[key as keyof typeof notifForm] ? "bg-sky-500" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          notifForm[key as keyof typeof notifForm] ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                ))}
                <button
                  onClick={handleSaveNotifications}
                  disabled={saving}
                  className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : saved ? "Saved!" : "Save Preferences"}
                </button>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black text-slate-800 mb-1">Password & Security</h2>
                  <p className="text-sm text-slate-400">Update your password to keep your account secure.</p>
                </div>
                {passwordError && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-600">
                    {passwordError}
                  </div>
                )}
                <div className="space-y-4">
                  {[
                    { key: "old_password", label: "Current Password" },
                    { key: "new_password", label: "New Password" },
                    { key: "confirm_password", label: "Confirm New Password" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">{label}</label>
                      <input
                        type="password"
                        value={passwordForm[key as keyof typeof passwordForm]}
                        onChange={(e) => setPasswordForm((f) => ({ ...f, [key]: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-sky-400 transition"
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleSavePassword}
                  disabled={saving}
                  className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition disabled:opacity-60"
                >
                  <Shield className="h-4 w-4" />
                  {saving ? "Updating..." : saved ? "Updated!" : "Update Password"}
                </button>
              </div>
            )}

          </div>
        </div>
      </main>

      {locationMapOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h3 className="text-lg font-black text-slate-800">Choose {activeServiceTab} location</h3><p className="text-xs text-slate-500">Click the map or drag the pin to the exact location.</p></div><button type="button" onClick={() => setLocationMapOpen(false)} className="rounded-xl px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100">Done</button></div>
            {!GOOGLE_MAPS_API_KEY ? <div className="p-6 text-sm text-rose-600">Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable the map picker.</div> : locationMapError ? <div className="flex h-[420px] items-center justify-center p-6 text-center text-sm font-semibold text-rose-600">{locationMapError}</div> : <div ref={locationMapRef} className="h-[420px] w-full bg-slate-100" />}
          </div>
        </div>
      ) : null}

      {showCreateEventModal ? (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm">
          <div className="flex h-[100dvh] w-screen flex-col bg-white">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-6 py-5 md:px-10">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Event Creator
                </p>
                <h3 className="mt-2 text-3xl font-black text-slate-800">Create Event</h3>
                <p className="mt-2 max-w-2xl text-sm text-slate-400">
                  Fill in every event detail here. The preview updates as you type.
                </p>
              </div>
              <button
                onClick={closeCreateEventModal}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                aria-label="Close create event modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid flex-1 gap-0 overflow-hidden lg:grid-cols-[360px,1fr]">
              <aside className="border-b border-slate-100 bg-slate-50/60 p-6 lg:border-b-0 lg:border-r lg:p-8">
                <div className="sticky top-0 space-y-6">
                  {!categoriesLoaded ? (
                    <div className="rounded-[28px] border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-500">
                      Loading category options...
                    </div>
                  ) : null}
                  <div className="rounded-[28px] bg-[#1e2a5e] p-6 text-white shadow-xl shadow-slate-900/10">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60">
                      Live Preview
                    </p>
                    <h4 className="mt-3 text-2xl font-black leading-tight">
                      {eventForm.title || "Event title will appear here"}
                    </h4>
                    <p className="mt-2 text-sm text-white/75">
                      {eventForm.eventType || "Event type"} in{" "}
                      {eventForm.venue || "your selected location"}
                    </p>
                    <div className="mt-5 space-y-2 text-sm text-white/80">
                      <p>
                        Date: {eventForm.eventDate || "Not selected"}
                        {eventForm.eventEndDate &&
                        eventForm.eventEndDate !== eventForm.eventDate
                          ? ` to ${eventForm.eventEndDate}`
                          : ""}
                      </p>
                      <p>
                        Time: {eventForm.startTime || "--:--"} to {eventForm.endTime || "--:--"}
                      </p>
                      <p>Capacity: {eventForm.capacity || "0"}</p>
                      <p>Ticket: {eventForm.ticketPrice || "0"}</p>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                    <h4 className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                      Event Details
                    </h4>
                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                      <SummaryRow label="Timezone" value={eventForm.timezone || "Asia/Dhaka"} />
                      <SummaryRow label="Registration Deadline" value={eventForm.registrationDeadline || "Not set"} />
                      <SummaryRow label="Status" value={eventForm.status} />
                      <SummaryRow label="Banner URL" value={eventForm.bannerImageUrl || "Not set"} />
                    </div>
                  </div>
                </div>
              </aside>

              <div className="flex min-h-0 flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto px-6 py-6 md:px-8 md:py-8">
                  {eventStatusMessage ? (
                    <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                      {eventStatusMessage}
                    </div>
                  ) : null}

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Field label="Event Title">
                  <input
                    value={eventForm.title}
                    onChange={(event) => setEventForm((current) => ({ ...current, title: event.target.value }))}
                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                    placeholder="Summer Food Festival"
                  />
                </Field>
                <Field label="Event Category">
                  <select
                    value={eventForm.eventType}
                    onChange={(event) =>
                      setEventForm((current) => ({
                        ...current,
                        eventType: event.target
                          .value as EventDiscoveryCategory,
                      }))
                    }
                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                  >
                    {EVENT_CATEGORY_OPTIONS.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Location">
                  <input
                    value={eventForm.venue}
                    onChange={(event) => setEventForm((current) => ({ ...current, venue: event.target.value }))}
                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                    placeholder="Main Hall"
                  />
                </Field>
                <Field label="Start Date">
                  <input
                    type="date"
                    value={eventForm.eventDate}
                    onChange={(event) =>
                      setEventForm((current) => ({
                        ...current,
                        eventDate: event.target.value,
                        eventEndDate:
                          !current.eventEndDate ||
                          current.eventEndDate < event.target.value
                            ? event.target.value
                            : current.eventEndDate,
                      }))
                    }
                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                  />
                </Field>
                <Field label="End Date">
                  <input
                    type="date"
                    min={eventForm.eventDate || undefined}
                    value={eventForm.eventEndDate}
                    onChange={(event) =>
                      setEventForm((current) => ({
                        ...current,
                        eventEndDate: event.target.value,
                      }))
                    }
                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                  />
                </Field>
                <Field label="Timezone">
                  <input
                    value={eventForm.timezone}
                    onChange={(event) => setEventForm((current) => ({ ...current, timezone: event.target.value }))}
                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                    placeholder="Asia/Dhaka"
                  />
                </Field>
                <Field label="Start Time">
                  <input
                    type="time"
                    value={eventForm.startTime}
                    onChange={(event) => setEventForm((current) => ({ ...current, startTime: event.target.value }))}
                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                  />
                </Field>
                <Field label="End Time">
                  <input
                    type="time"
                    value={eventForm.endTime}
                    onChange={(event) => setEventForm((current) => ({ ...current, endTime: event.target.value }))}
                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                  />
                </Field>
                <Field label="Capacity">
                  <input
                    type="number"
                    min="1"
                    value={eventForm.capacity}
                    onChange={(event) => setEventForm((current) => ({ ...current, capacity: event.target.value }))}
                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                    placeholder="100"
                  />
                </Field>
                <Field label="Ticket Price">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={eventForm.ticketPrice}
                    onChange={(event) => setEventForm((current) => ({ ...current, ticketPrice: event.target.value }))}
                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                    placeholder="25"
                  />
                </Field>
                <Field label="Registration Deadline">
                  <input
                    type="date"
                    value={eventForm.registrationDeadline}
                    onChange={(event) =>
                      setEventForm((current) => ({
                        ...current,
                        registrationDeadline: event.target.value,
                      }))
                    }
                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                  />
                </Field>
                <Field label="Banner Image">
                  <div className="space-y-3">
                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        void handleBannerUpload(event.target.files?.[0] ?? null);
                        event.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => bannerInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      <CalendarPlus2 className="h-4 w-4" />
                      {eventForm.bannerImageUrl ? "Replace Banner" : "Upload Banner"}
                    </button>
                    {eventForm.bannerImageUrl ? (
                      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                        <img
                          src={eventForm.bannerImageUrl}
                          alt="Banner preview"
                          className="h-40 w-full object-cover"
                        />
                        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
                          <p className="truncate text-xs font-semibold text-slate-500">
                            Banner uploaded
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              setEventForm((current) => ({ ...current, bannerImageUrl: "" }))
                            }
                            className="text-xs font-bold text-rose-600"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs font-medium text-slate-400">
                        Upload a JPG or PNG banner image.
                      </p>
                    )}
                  </div>
                </Field>
                <Field label="Status">
                  <select
                    value={eventForm.status}
                    onChange={(event) =>
                      setEventForm((current) => ({
                        ...current,
                        status: event.target.value as VendorEventStatus,
                      }))
                    }
                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                    <option value="cancelled">Cancelled</option>
                    </select>
                </Field>
                  </div>

                  <Field label="Description">
                    <textarea
                      value={eventForm.description}
                      onChange={(event) =>
                        setEventForm((current) => ({ ...current, description: event.target.value }))
                      }
                      rows={8}
                      className="w-full rounded-[20px] border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                      placeholder="Describe the event, guest experience, schedule, and important notes."
                    />
                  </Field>
                </div>

                <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-white px-6 py-5 md:px-8">
                  <button
                    onClick={closeCreateEventModal}
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => void handleCreateEvent()}
                    disabled={eventSaving}
                    className="rounded-2xl bg-[#1e2a5e] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1a2552] disabled:opacity-60"
                  >
                    {eventSaving ? "Creating..." : "Create Event"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function TimeSelects({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const parts = splitServiceTime(value);
  const selectClass = "min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-sky-400";
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
        <select aria-label={`${label} hour`} value={parts.hour} onChange={(event) => onChange(setServiceTimePart(value, "hour", event.target.value))} className={selectClass}><option value="">Hour</option>{SERVICE_HOURS.map((hour) => <option key={hour} value={hour}>{hour}</option>)}</select>
        <select aria-label={`${label} minute`} value={parts.minute} onChange={(event) => onChange(setServiceTimePart(value, "minute", event.target.value))} className={selectClass}><option value="">Min</option>{SERVICE_MINUTES.map((minute) => <option key={minute} value={minute}>{minute}</option>)}</select>
        <select aria-label={`${label} period`} value={parts.period} onChange={(event) => onChange(setServiceTimePart(value, "period", event.target.value))} className={selectClass}><option value="">AM/PM</option>{SERVICE_PERIODS.map((period) => <option key={period} value={period}>{period}</option>)}</select>
      </div>
    </label>
  );
}

function OptionChipEditor({
  label,
  values,
  suggestions,
  addLabel,
  inputPlaceholder,
  emptyMessage,
  helpText,
  onAddCustom,
  onChange,
}: {
  label: string;
  values: string[];
  suggestions: string[];
  addLabel: string;
  inputPlaceholder: string;
  emptyMessage: string;
  helpText?: string;
  onAddCustom?: (value: string) => Promise<void>;
  onChange: (values: string[]) => void;
}) {
  const [addingCustom, setAddingCustom] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [savingCustom, setSavingCustom] = useState(false);
  const [customError, setCustomError] = useState("");

  const hasValue = (value: string) =>
    values.some((item) => item.toLocaleLowerCase() === value.toLocaleLowerCase());

  const addValue = (value: string) => {
    const normalized = value.trim();
    if (!normalized || hasValue(normalized)) return;
    onChange([...values, normalized]);
  };

  const removeValue = (value: string) => {
    onChange(values.filter((item) => item !== value));
  };

  const saveCustomValue = async () => {
    const normalized = customValue.trim();
    if (!normalized) return;
    if (hasValue(normalized)) {
      setCustomError(`${normalized} is already selected.`);
      return;
    }
    setSavingCustom(true);
    setCustomError("");
    try {
      if (onAddCustom) {
        await onAddCustom(normalized);
      } else {
        addValue(normalized);
      }
      setCustomValue("");
      setAddingCustom(false);
    } catch (error) {
      setCustomError(error instanceof Error ? error.message : `Failed to add ${label.toLocaleLowerCase()}.`);
    } finally {
      setSavingCustom(false);
    }
  };

  return (
    <section aria-label={label} className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
        {!addingCustom ? (
          <button
            type="button"
            onClick={() => setAddingCustom(true)}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-sky-600 transition hover:bg-sky-50"
          >
            <Plus className="h-3.5 w-3.5" />
            {addLabel}
          </button>
        ) : null}
      </div>

      <div className="mt-3 flex min-h-8 flex-wrap gap-2">
        {values.length ? values.map((value) => (
          <span key={value} className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 ring-1 ring-inset ring-sky-100">
            {value}
            <button
              type="button"
              onClick={() => removeValue(value)}
              aria-label={`Remove ${value}`}
              className="rounded-full p-0.5 text-sky-500 transition hover:bg-sky-100 hover:text-sky-800"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        )) : (
          <span className="text-xs text-slate-400">{emptyMessage}</span>
        )}
      </div>

      {suggestions.some((suggestion) => !hasValue(suggestion)) ? (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Quick add</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.filter((suggestion) => !hasValue(suggestion)).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => addValue(suggestion)}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
              >
                <Plus className="h-3 w-3" />
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {addingCustom ? (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
          <input
            autoFocus
            value={customValue}
            onChange={(event) => setCustomValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void saveCustomValue();
              }
              if (event.key === "Escape") {
                setCustomValue("");
                setCustomError("");
                setAddingCustom(false);
              }
            }}
            disabled={savingCustom}
            placeholder={inputPlaceholder}
            className="min-w-[220px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
          <button type="button" onClick={() => void saveCustomValue()} disabled={!customValue.trim() || savingCustom} className="rounded-lg bg-sky-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50">{savingCustom ? "Adding..." : "Add"}</button>
          <button type="button" onClick={() => { setCustomValue(""); setCustomError(""); setAddingCustom(false); }} disabled={savingCustom} className="rounded-lg px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100 disabled:opacity-50">Cancel</button>
          {customError ? <p role="alert" className="w-full text-xs font-semibold text-rose-600">{customError}</p> : null}
        </div>
      ) : null}

      {helpText ? <p className="mt-3 text-xs text-slate-400">{helpText}</p> : null}
    </section>
  );
}

function bookingTimeInMinutes(value: string) {
  const parts = splitServiceTime(value);
  const hour = Number(parts.hour);
  const minute = Number(parts.minute);
  if (!hour || Number.isNaN(minute) || !parts.period) return Number.MAX_SAFE_INTEGER;
  return ((hour % 12) + (parts.period === "PM" ? 12 : 0)) * 60 + minute;
}

function BookingTimesEditor({
  values,
  onChange,
}: {
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const [selectedTime, setSelectedTime] = useState("");
  const availableOptions = BOOKING_TIME_OPTIONS.filter((time) => !values.includes(time));

  const addTime = () => {
    if (!selectedTime || values.includes(selectedTime)) return;
    onChange([...values, selectedTime].sort((left, right) => bookingTimeInMinutes(left) - bookingTimeInMinutes(right)));
    setSelectedTime("");
  };

  return (
    <section aria-label="Table booking times" className="rounded-xl border border-slate-200 bg-white p-4">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Table booking times</span>
      <div className="mt-3 flex min-h-8 flex-wrap gap-2">
        {values.length ? values.map((time) => (
          <span key={time} className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 ring-1 ring-inset ring-indigo-100">
            {time}
            <button
              type="button"
              onClick={() => onChange(values.filter((value) => value !== time))}
              aria-label={`Remove ${time}`}
              className="rounded-full p-0.5 text-indigo-500 transition hover:bg-indigo-100 hover:text-indigo-800"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        )) : (
          <span className="text-xs text-slate-400">No table booking times added yet.</span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
        <select
          aria-label="Select table booking time"
          value={selectedTime}
          onChange={(event) => setSelectedTime(event.target.value)}
          className="min-w-[220px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        >
          <option value="">Select an available time</option>
          {availableOptions.map((time) => <option key={time} value={time}>{time}</option>)}
        </select>
        <button
          type="button"
          onClick={addTime}
          disabled={!selectedTime}
          className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Add time
        </button>
      </div>
      <p className="mt-3 text-xs text-slate-400">Only these times will be offered for table bookings in the customer app.</p>
    </section>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <span className="max-w-[180px] text-right text-sm font-semibold text-slate-700">
        {value}
      </span>
    </div>
  );
}
