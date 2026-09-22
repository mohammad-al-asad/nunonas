"use client";

import { Header } from "@/components/Header";
import { useToast } from "@/components/ui/ToastProvider";
import {
  vendorCreateEvent,
  vendorDeleteEvent,
  vendorGetProfileSettings,
  vendorGetEvent,
  vendorListEvents,
  vendorUpdateEvent,
  vendorUpdateEventStatus,
  uploadVendorFile,
  type VendorEventPayload,
  type VendorEventStatus,
} from "@/lib/vendor-api";
import { cn } from "@/lib/utils";
import {
  EVENT_CATEGORY_OPTIONS,
  normalizeEventCategory,
  type EventDiscoveryCategory,
} from "@/lib/event-categories";
import { Archive, CalendarDays, CheckCircle2, CircleX, Clock3, Eye, FilePenLine, MapPin, Pencil, Plus, Search, Trash2, Upload, Users, X } from "lucide-react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { vendorQueryKeys } from "@/lib/vendor-queries";
import { useUnsavedChanges } from "@/lib/use-unsaved-changes";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  loadGoogleMaps,
  toGoogleLatLngLiteral,
  type GoogleAdvancedMarkerInstance,
  type GoogleGeocoderResult,
  type GoogleMapInstance,
  type GoogleMapMouseEvent,
  type GoogleMarkerPosition,
} from "@/lib/google-maps";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const GOOGLE_MAPS_MAP_ID =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";
const DEFAULT_TIMEZONE = "Asia/Dhaka";
const TIMEZONE_OPTIONS = [
  "Asia/Dhaka",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Bangkok",
  "Asia/Kuala_Lumpur",
  "Asia/Tokyo",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Australia/Sydney",
  "UTC",
];

type TimezoneOption = {
  value: string;
  label: string;
};

type LocationOption = {
  value: string;
  label: string;
};

type VendorEventRecord = {
  id: string;
  title: string;
  event_type: EventDiscoveryCategory;
  event_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  timezone?: string;
  venue: string;
  latitude?: number | null;
  longitude?: number | null;
  capacity: number;
  ticket_price: number;
  registration_deadline?: string | null;
  description: string;
  banner_image_url?: string | null;
  active?: boolean;
  status: VendorEventStatus;
};

type FormState = {
  title: string;
  eventType: EventDiscoveryCategory;
  eventDate: string;
  eventEndDate: string;
  startTime: string;
  endTime: string;
  timezone: string;
  venue: string;
  latitude: number | null;
  longitude: number | null;
  capacity: string;
  ticketPrice: string;
  registrationDeadline: string;
  description: string;
  bannerImageUrl: string;
  status: VendorEventStatus;
};

function getDefaultForm(): FormState {
  return {
    title: "",
    eventType: "Music",
    eventDate: "",
    eventEndDate: "",
    startTime: "",
    endTime: "",
    timezone: DEFAULT_TIMEZONE,
    venue: "",
    latitude: null,
    longitude: null,
    capacity: "",
    ticketPrice: "",
    registrationDeadline: "",
    description: "",
    bannerImageUrl: "",
    status: "draft",
  };
}

function normalizeEvent(row: Record<string, unknown>): VendorEventRecord {
  return {
    id: String(row.id ?? row._id ?? ""),
    title: String(row.title ?? ""),
    event_type: normalizeEventCategory(
      row.event_category ?? row.event_type,
    ),
    event_date: String(row.event_date ?? ""),
    end_date: String(row.end_date ?? row.event_date ?? ""),
    start_time: String(row.start_time ?? ""),
    end_time: String(row.end_time ?? ""),
    timezone: String(row.timezone ?? DEFAULT_TIMEZONE),
    venue: String(row.venue ?? ""),
    latitude: row.latitude == null ? null : Number(row.latitude),
    longitude: row.longitude == null ? null : Number(row.longitude),
    capacity: Number(row.capacity ?? 0),
    ticket_price: Number(row.ticket_price ?? 0),
    registration_deadline:
      row.registration_deadline == null ? null : String(row.registration_deadline),
    description: String(row.description ?? ""),
    banner_image_url: row.banner_image_url == null ? null : String(row.banner_image_url),
    active: Boolean(row.active ?? row.active_status ?? true),
    status: String(row.status ?? "draft").toLowerCase() as VendorEventStatus,
  };
}

function toPayload(form: FormState): VendorEventPayload {
  return {
    title: form.title.trim(),
    event_type: form.eventType,
    event_date: form.eventDate,
    end_date: form.eventEndDate,
    start_time: form.startTime,
    end_time: form.endTime,
    timezone: form.timezone.trim() || DEFAULT_TIMEZONE,
    venue: form.venue.trim(),
    latitude: form.latitude,
    longitude: form.longitude,
    capacity: Number(form.capacity),
    ticket_price: Number(form.ticketPrice),
    registration_deadline: form.registrationDeadline || null,
    description: form.description.trim(),
    banner_image_url: form.bannerImageUrl.trim() || null,
    active_status: true,
    status: form.status,
  };
}

function validateForm(form: FormState): string | null {
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

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatEventDate(value: string) {
  if (!value) return "Date not set";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function formatRegistrationDeadline(value: string) {
  return formatEventDate(value.slice(0, 10));
}

function detectBrowserTimezone() {
  try {
    const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return resolved && resolved.trim() ? resolved : DEFAULT_TIMEZONE;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

function buildTimezoneOptions(currentValue: string) {
  const supportedValuesOf = (
    Intl as typeof Intl & {
      supportedValuesOf?: (key: "timeZone") => string[];
    }
  ).supportedValuesOf;
  const values = new Set([
    ...TIMEZONE_OPTIONS,
    ...(typeof supportedValuesOf === "function" ? supportedValuesOf("timeZone") : []),
  ]);
  if (currentValue.trim()) {
    values.add(currentValue.trim());
  }
  return Array.from(values).sort((left, right) => left.localeCompare(right));
}

function formatTimezoneOffset(timezone: string) {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
      hour: "2-digit",
      minute: "2-digit",
    });
    const zonePart = formatter
      .formatToParts(new Date())
      .find((part) => part.type === "timeZoneName")?.value;

    if (!zonePart) {
      return "UTC";
    }

    return zonePart.replace("GMT", "UTC");
  } catch {
    return "UTC";
  }
}

function buildTimezoneSelectOptions(currentValue: string, detectedTimezone: string): TimezoneOption[] {
  return buildTimezoneOptions(currentValue).map((timezone) => ({
    value: timezone,
    label:
      timezone === detectedTimezone
        ? `${formatTimezoneOffset(timezone)} · ${timezone} · Your timezone`
        : `${formatTimezoneOffset(timezone)} · ${timezone}`,
  }));
}

function deriveSavedRestaurantLocation(profile: Record<string, unknown>) {
  const candidates = [
    profile.location_value,
    profile.office_address,
    profile.business_address,
    profile.address,
  ];

  for (const value of candidates) {
    const normalized = String(value ?? "").trim();
    if (normalized) {
      return normalized;
    }
  }

  return "";
}

function buildSavedLocationLabel() {
  return "Saved business location";
}

export function EventsPageClient({ startInCreateMode = false }: { startInCreateMode?: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const detectedTimezone = useMemo(() => detectBrowserTimezone(), []);
  const [events, setEvents] = useState<VendorEventRecord[]>([]);
  const [form, setForm] = useState<FormState>(() => ({
    ...getDefaultForm(),
    timezone: detectedTimezone,
  }));
  const [formBaseline, setFormBaseline] = useState<FormState>(() => ({
    ...getDefaultForm(),
    timezone: detectedTimezone,
  }));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(startInCreateMode);
  const [statusMessage, setStatusMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedStatusFilter, setAppliedStatusFilter] = useState<string>("all");
  const [showArchived, setShowArchived] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showBannerPreview, setShowBannerPreview] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [pendingEventAction, setPendingEventAction] = useState<{
    event: VendorEventRecord;
    action: "archive" | "delete";
  } | null>(null);
  const [eventActionBusy, setEventActionBusy] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailEvent, setDetailEvent] = useState<VendorEventRecord | null>(null);
  const [savedRestaurantLocation, setSavedRestaurantLocation] = useState("");
  const [currentLocationLabel, setCurrentLocationLabel] = useState("Current location");
  const [tempCoords, setTempCoords] = useState({ lat: 23.8103, lng: 90.4125 });
  const [tempAddress, setTempAddress] = useState("");
  const [mapError, setMapError] = useState("");
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const mapInitializedRef = useRef(false);
  const tempCoordsRef = useRef(tempCoords);
  const tempAddressRef = useRef(tempAddress);
  const timezoneOptions = useMemo(
    () => buildTimezoneSelectOptions(form.timezone, detectedTimezone),
    [detectedTimezone, form.timezone],
  );
  const locationOptions = useMemo(() => {
    const options: LocationOption[] = [];
    if (savedRestaurantLocation) {
      options.push({
        value: savedRestaurantLocation,
        label: buildSavedLocationLabel(),
      });
    }
    if (currentLocationLabel.trim()) {
      const normalizedCurrentLocation = currentLocationLabel.replace(/^Custom location:\s*/, "").trim();
      options.push({
        value: normalizedCurrentLocation,
        label: currentLocationLabel.startsWith("Custom location:") ? "Custom location" : "Current location",
      });
    }
    return options;
  }, [currentLocationLabel, savedRestaurantLocation]);
  const formDirty = showForm && JSON.stringify(form) !== JSON.stringify(formBaseline);
  useUnsavedChanges(formDirty && !saving);

  useEffect(() => {
    tempCoordsRef.current = tempCoords;
  }, [tempCoords]);

  useEffect(() => {
    tempAddressRef.current = tempAddress;
  }, [tempAddress]);

  const loadEvents = async () => {
    const response = await vendorListEvents();
    const nextItems = Array.isArray(response.items)
      ? response.items.map((item) => normalizeEvent(item as Record<string, unknown>))
      : [];
    setEvents(nextItems);
  };

  const refreshProfileLocation = async () => {
    const profile = await vendorGetProfileSettings();
    const nextSavedLocation = deriveSavedRestaurantLocation(profile);
    setSavedRestaurantLocation(nextSavedLocation);
    setForm((current) => ({
      ...current,
      timezone: current.timezone || detectedTimezone,
      venue: current.venue || nextSavedLocation,
    }));
    setFormBaseline((current) => ({
      ...current,
      timezone: current.timezone || detectedTimezone,
      venue: current.venue || nextSavedLocation,
    }));
    return nextSavedLocation;
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const profile = await vendorGetProfileSettings();
        if (!active) return;
        const nextSavedLocation = deriveSavedRestaurantLocation(profile);
        setSavedRestaurantLocation(nextSavedLocation);
        setForm((current) => ({
          ...current,
          timezone: current.timezone || detectedTimezone,
          venue: current.venue || nextSavedLocation,
        }));
        setFormBaseline((current) => ({
          ...current,
          timezone: current.timezone || detectedTimezone,
          venue: current.venue || nextSavedLocation,
        }));
        await loadEvents();
      } catch (error) {
        if (!active) return;
        setStatusMessage(error instanceof Error ? error.message : "Failed to load events.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [detectedTimezone]);

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setTempCoords(nextCoords);
        setCurrentLocationLabel(
          `Current location (${nextCoords.lat.toFixed(4)}, ${nextCoords.lng.toFixed(4)})`,
        );
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  }, []);

  useEffect(() => {
    if (!showMapModal || !GOOGLE_MAPS_API_KEY || mapInitializedRef.current) return;
    mapInitializedRef.current = true;
    let map: GoogleMapInstance | undefined;
    let marker: GoogleAdvancedMarkerInstance | undefined;
    let cancelled = false;

    void (async () => {
      try {
        const googleMaps = await loadGoogleMaps(GOOGLE_MAPS_API_KEY);
        if (cancelled) return;
        const initialCoords = tempCoordsRef.current;
        const mapElement = document.getElementById("event-google-map-element");
        if (!mapElement) return;
        const geocoder = new googleMaps.Geocoder();
        map = new googleMaps.Map(mapElement, {
          center: initialCoords,
          zoom: 14,
          mapId: GOOGLE_MAPS_MAP_ID,
          mapTypeControl: false,
          streetViewControl: false,
        });
        marker = new googleMaps.AdvancedMarkerElement({
          position: initialCoords,
          map,
          gmpDraggable: true,
        });
        const reverseGeocode = (position: { lat: number; lng: number }) => {
          geocoder.geocode(
            { location: position },
            (results: GoogleGeocoderResult[] | null, status: string) => {
              if (cancelled) return;
              setTempAddress(
                status === "OK" && results?.[0]?.formatted_address
                  ? results[0].formatted_address
                  : `Coordinate (${position.lat.toFixed(4)}, ${position.lng.toFixed(4)})`,
              );
            },
          );
        };
        const updateLocation = (position: GoogleMarkerPosition) => {
          const next = toGoogleLatLngLiteral(position);
          if (!next) return;
          if (marker) marker.position = next;
          setTempCoords(next);
          reverseGeocode(next);
        };
        map.addListener("click", (event: GoogleMapMouseEvent) => {
          if (event.latLng) updateLocation(event.latLng);
        });
        marker.addListener("dragend", () => {
          const position = marker?.position;
          if (position) updateLocation(position);
        });
        const initialTempAddress = tempAddressRef.current.trim();
        const initialAddress = form.venue.trim() || initialTempAddress;
        if (initialAddress.length > 3) {
          geocoder.geocode(
            { address: initialAddress },
            (results: GoogleGeocoderResult[] | null, status: string) => {
              const location = results?.[0]?.geometry?.location;
              if (cancelled || status !== "OK" || !location || !map || !marker) return;
              const next = { lat: Number(location.lat()), lng: Number(location.lng()) };
              map.setCenter(next);
              marker.position = next;
              setTempCoords(next);
              setTempAddress(results?.[0]?.formatted_address || initialAddress);
            },
          );
        }
        if (navigator.geolocation && !form.venue.trim() && !initialTempAddress) {
          navigator.geolocation.getCurrentPosition((position) => {
            if (!map || !marker) return;
            const next = { lat: position.coords.latitude, lng: position.coords.longitude };
            map.setCenter(next);
            marker.position = next;
            setTempCoords(next);
            reverseGeocode(next);
          }, () => undefined, { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 });
        }
      } catch (error) {
        if (cancelled) return;
        mapInitializedRef.current = false;
        setMapError(
          error instanceof Error ? error.message : "Google Maps could not be initialized.",
        );
      }
    })();

    return () => {
      cancelled = true;
      const googleMaps = window.google?.maps;
      if (googleMaps?.event && map) googleMaps.event.clearInstanceListeners(map);
      if (googleMaps?.event && marker) googleMaps.event.clearInstanceListeners(marker);
      if (marker) marker.map = null;
      mapInitializedRef.current = false;
    };
  }, [form.venue, showMapModal]);

  const stats = useMemo(() => {
    const currentEvents = events.filter((item) => item.status !== "archived");
    return {
      total: currentEvents.length,
      published: currentEvents.filter((item) => item.status === "published").length,
      draft: currentEvents.filter((item) => item.status === "draft").length,
      cancelled: currentEvents.filter((item) => item.status === "cancelled").length,
      archived: events.filter((item) => item.status === "archived").length,
    };
  }, [events]);

  useEffect(() => {
    if (!loading && stats.archived === 0 && showArchived) {
      setShowArchived(false);
    }
  }, [loading, showArchived, stats.archived]);

  const visibleEvents = useMemo(() => {
    const normalizedSearch = appliedSearch.trim().toLowerCase();
    return events.filter((event) => {
      if (showArchived ? event.status !== "archived" : event.status === "archived") {
        return false;
      }
      if (!showArchived && appliedStatusFilter !== "all" && event.status !== appliedStatusFilter) {
        return false;
      }
      if (!normalizedSearch) {
        return true;
      }
      return [event.title, event.venue, event.event_type].some((value) =>
        value.toLowerCase().includes(normalizedSearch),
      );
    });
  }, [appliedSearch, appliedStatusFilter, events, showArchived]);

  const resetForm = () => {
    const nextForm = {
      ...getDefaultForm(),
      timezone: detectedTimezone,
      venue: savedRestaurantLocation,
      latitude: null,
      longitude: null,
    };
    setForm(nextForm);
    setFormBaseline(nextForm);
    setEditingId(null);
    setShowForm(false);
    setShowMapModal(false);
    setShowBannerPreview(false);
    setShowSaveConfirm(false);
    setShowDiscardConfirm(false);
    setShowDetailModal(false);
    setDetailLoading(false);
    setDetailError("");
    setDetailEvent(null);
    setTempAddress("");
    setFormError("");
  };

  const openCreateForm = async () => {
    let nextSavedLocation = savedRestaurantLocation;
    try {
      nextSavedLocation = await refreshProfileLocation();
    } catch {
      // Keep the form usable even if the profile refresh fails.
    }
    const nextForm = {
      ...getDefaultForm(),
      timezone: detectedTimezone,
      venue: nextSavedLocation,
      latitude: null,
      longitude: null,
    };
    setForm(nextForm);
    setFormBaseline(nextForm);
    setEditingId(null);
    setShowForm(true);
    setTempAddress("");
    setFormError("");
  };

  const openMapPicker = () => {
    if (!GOOGLE_MAPS_API_KEY) {
      setFormError("Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to the service-provider app.");
      return;
    }
    setMapError("");
    setTempAddress(form.venue.trim());
    setShowMapModal(true);
  };

  const handleConfirmMapLocation = () => {
    const nextAddress = tempAddress.trim();
    setForm((prev) => ({
      ...prev,
      venue: nextAddress || prev.venue,
      latitude: tempCoords.lat,
      longitude: tempCoords.lng,
    }));
    if (nextAddress && nextAddress !== savedRestaurantLocation) {
      setCurrentLocationLabel(`Custom location: ${nextAddress}`);
    }
    setShowMapModal(false);
  };

  const handleSelectLocationOption = (option: LocationOption) => {
    setForm((prev) => ({
      ...prev,
      venue: option.value,
      latitude: option.value === savedRestaurantLocation ? null : prev.latitude,
      longitude: option.value === savedRestaurantLocation ? null : prev.longitude,
    }));
    setTempAddress(option.value);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setDetailLoading(false);
    setDetailError("");
    setDetailEvent(null);
  };

  const openEventDetails = async (eventId: string) => {
    const cachedEvent = events.find((item) => item.id === eventId) ?? null;
    setShowDetailModal(true);
    setDetailEvent(cachedEvent);
    setDetailLoading(!cachedEvent);
    setDetailError("");

    try {
      const response = await vendorGetEvent(eventId);
      setDetailEvent(normalizeEvent(response));
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "Failed to load event details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBannerUpload = async (file: File | null) => {
    if (!file) {
      return;
    }

    try {
      setStatusMessage("Uploading banner image...");
      const url = await uploadVendorFile(file);
      setForm((prev) => ({ ...prev, bannerImageUrl: url }));
      setStatusMessage("Banner image uploaded.");
      toast("Event banner uploaded.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to upload banner image.", "error");
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to upload banner image.",
      );
    }
  };

  const handleOpenSaveConfirm = () => {
    const validationError = validateForm(form);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError("");
    setStatusMessage("");
    setShowSaveConfirm(true);
  };

  const handleSubmit = async () => {
    const validationError = validateForm(form);
    if (validationError) {
      setFormError(validationError);
      setShowSaveConfirm(false);
      return;
    }

    setSaving(true);
    setFormError("");
    setStatusMessage("");
    try {
      const payload = toPayload(form);
      const wasEditing = Boolean(editingId);
      const savedResponse = editingId
        ? await vendorUpdateEvent(editingId, payload)
        : await vendorCreateEvent(payload);
      const savedEvent = normalizeEvent(savedResponse);
      if (savedEvent.id) {
        setEvents((current) => {
          const existingIndex = current.findIndex((item) => item.id === savedEvent.id);
          if (existingIndex < 0) return [savedEvent, ...current];
          return current.map((item, index) =>
            index === existingIndex ? savedEvent : item,
          );
        });
      }

      const successMessage = wasEditing ? "Event updated." : "Event created.";
      setStatusMessage(successMessage);
      toast(successMessage, "success");
      resetForm();
      void queryClient.invalidateQueries({ queryKey: vendorQueryKeys.events() });
      try {
        await loadEvents();
      } catch {
        setStatusMessage(
          `${successMessage} The latest list could not be refreshed automatically.`,
        );
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to save event.", "error");
      setFormError(error instanceof Error ? error.message : "Failed to save event.");
    } finally {
      setShowSaveConfirm(false);
      setSaving(false);
    }
  };

  const handleEdit = (event: VendorEventRecord) => {
    setShowDetailModal(false);
    setDetailLoading(false);
    setDetailError("");
    setDetailEvent(null);
    setEditingId(event.id);
    setShowForm(true);
    setStatusMessage("");
    setFormError("");
    const nextForm: FormState = {
      title: event.title,
      eventType: event.event_type,
      eventDate: event.event_date,
      eventEndDate: event.end_date || event.event_date,
      startTime: event.start_time,
      endTime: event.end_time,
      timezone: event.timezone || detectedTimezone,
      venue: event.venue,
      latitude: event.latitude ?? null,
      longitude: event.longitude ?? null,
      capacity: String(event.capacity),
      ticketPrice: String(event.ticket_price),
      registrationDeadline: event.registration_deadline?.slice(0, 10) ?? "",
      description: event.description,
      bannerImageUrl: event.banner_image_url ?? "",
      status: event.status,
    };
    setForm(nextForm);
    setFormBaseline(nextForm);
    setTempAddress(event.venue);
    setTempCoords({
      lat: event.latitude ?? tempCoords.lat,
      lng: event.longitude ?? tempCoords.lng,
    });
  };

  const requestCloseForm = () => {
    if (formDirty) {
      setShowDiscardConfirm(true);
      return;
    }
    resetForm();
  };

  const confirmEventAction = async () => {
    if (!pendingEventAction) return;
    setEventActionBusy(true);
    try {
      const succeeded = pendingEventAction.action === "delete"
        ? await handleDelete(pendingEventAction.event.id)
        : await handleStatusChange(pendingEventAction.event.id, "archived");
      if (succeeded) setPendingEventAction(null);
    } finally {
      setEventActionBusy(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    try {
      await vendorDeleteEvent(eventId);
      await loadEvents();
      await queryClient.invalidateQueries({ queryKey: vendorQueryKeys.events() });
      if (editingId === eventId) {
        resetForm();
      }
      setStatusMessage("Event deleted.");
      toast("Event deleted.", "success");
      return true;
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to delete event.", "error");
      setStatusMessage(error instanceof Error ? error.message : "Failed to delete event.");
      return false;
    }
  };

  const handleStatusChange = async (eventId: string, nextStatus: VendorEventStatus) => {
    try {
      await vendorUpdateEventStatus(eventId, nextStatus);
      await loadEvents();
      await queryClient.invalidateQueries({ queryKey: vendorQueryKeys.events() });
      setStatusMessage(`Event marked as ${nextStatus}.`);
      toast(`Event marked as ${nextStatus}.`, "success");
      return true;
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to update event status.", "error");
      setStatusMessage(error instanceof Error ? error.message : "Failed to update event status.");
      return false;
    }
  };

  const applyFilters = async () => {
    try {
      await loadEvents();
      setAppliedSearch(search);
      setAppliedStatusFilter(statusFilter);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to filter events.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <Header title="Event Management" />

      <main className="flex-1 px-4 py-6 pb-24 sm:px-6 lg:px-8">
        <div className="w-full space-y-8">
          <div className="flex justify-end">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={openCreateForm}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1e2a5e] px-5 py-3 text-sm font-bold text-white shadow-xl shadow-slate-900/10 transition hover:bg-[#1a2552]"
              >
                <Plus className="h-4 w-4" />
                Create Event
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total events" value={String(stats.total)} icon={CalendarDays} tone="sky" />
            <StatCard label="Published" value={String(stats.published)} icon={CheckCircle2} tone="emerald" />
            <StatCard label="Draft" value={String(stats.draft)} icon={FilePenLine} tone="amber" />
            <StatCard label="Cancelled" value={String(stats.cancelled)} icon={CircleX} tone="rose" />
          </div>

          {statusMessage ? (
            <p className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm font-bold text-sky-700">{statusMessage}</p>
          ) : null}

          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-5 border-b border-slate-100 px-5 py-5 lg:flex-row lg:items-center lg:justify-between md:px-6">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-black text-slate-800">
                      {showArchived ? "Archived Events" : "Event List"}
                    </h2>
                    {stats.archived > 0 ? (
                      <button
                        type="button"
                        onClick={() => setShowArchived((current) => !current)}
                        aria-pressed={showArchived}
                        className={cn(
                          "inline-flex h-9 items-center gap-2 rounded-xl border px-3.5 text-xs font-bold transition",
                          showArchived
                            ? "border-[#1e2a5e] bg-[#1e2a5e] text-white hover:bg-[#1a2552]"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100",
                        )}
                      >
                        <Archive className="h-3.5 w-3.5" />
                        {showArchived ? "Back to event list" : `Show archived (${stats.archived})`}
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    {showArchived
                      ? "Archived events are kept separate from your normal event list."
                      : `Create and manage events.${stats.archived > 0 ? " Archived events are hidden." : ""}`}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_170px_auto] lg:w-[620px]">
                  <label className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search events, venues, or event categories"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-sky-500 focus:bg-white"
                    />
                  </label>
                  {showArchived ? (
                    <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-100 px-4 text-sm font-semibold text-slate-500">
                      Archived only
                    </div>
                  ) : (
                    <select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                      className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-600 outline-none transition focus:border-sky-500 focus:bg-white"
                    >
                      <option value="all">All statuses</option>
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  )}
                  <button
                    onClick={() => void applyFilters()}
                    className="h-11 rounded-xl bg-[#1e2a5e] px-6 text-sm font-bold text-white transition hover:bg-[#1a2552]"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="m-5 h-48 animate-pulse rounded-2xl bg-slate-50" />
              ) : visibleEvents.length === 0 ? (
                <div className="m-5 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
                  <p className="text-lg font-bold text-slate-700">
                    {showArchived ? "No archived events." : "No events match these filters."}
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    {showArchived
                      ? "Events you archive will appear here and remain available for review."
                      : "Try changing the search or status filter, or create a new event."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4 p-5 md:p-6">
                  {visibleEvents.map((event) => (
                    <article key={event.id} className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm transition hover:border-sky-200 hover:shadow-md">
                      <div className="grid md:grid-cols-[200px_minmax(0,1fr)]">
                        <div className="relative min-h-40 overflow-hidden bg-gradient-to-br from-[#1e2a5e] to-sky-500 md:min-h-full">
                          {event.banner_image_url ? (
                            <img
                              src={event.banner_image_url}
                              alt={`${event.title} banner`}
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/90">
                              <CalendarDays className="h-9 w-9" />
                              <span className="mt-2 text-xs font-black uppercase tracking-[0.16em]">Event</span>
                            </div>
                          )}
                          <span className={cn("absolute left-3 top-3 shadow-sm", statusClass(event.status))}>{event.status}</span>
                        </div>

                        <div className="min-w-0 p-5">
                          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                            <div className="min-w-0">
                              <Link
                                href={`/events/${event.id}`}
                                className="text-xl font-black text-slate-800 transition hover:text-[#1e2a5e]"
                              >
                                {event.title}
                              </Link>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
                                  {event.event_type}
                                </span>
                              </div>
                            </div>
                            <div className="flex shrink-0 gap-2">
                              <button
                                type="button"
                                onClick={() => void openEventDetails(event.id)}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#1e2a5e] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1a2552]"
                              >
                                <Eye className="h-4 w-4" />
                                View details
                              </button>
                              <button
                                onClick={() => handleEdit(event)}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                              >
                                <Pencil className="h-4 w-4" />
                                Edit
                              </button>
                            </div>
                          </div>

                          <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-500">{event.description}</p>

                          <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
                            <Meta
                              icon={CalendarDays}
                              label={
                                event.end_date !== event.event_date
                                  ? `${formatEventDate(event.event_date)} - ${formatEventDate(event.end_date)}`
                                  : formatEventDate(event.event_date)
                              }
                            />
                            <Meta icon={Clock3} label={`${event.start_time} - ${event.end_time}`} />
                            <Meta icon={MapPin} label={event.venue} />
                            <Meta icon={Users} label={`${event.capacity} seats · ${formatMoney(event.ticket_price)}`} />
                          </div>

                          <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 lg:flex-row lg:items-center lg:justify-between">
                            <p className="text-xs font-semibold text-slate-400">
                              {event.registration_deadline
                                ? `Registration closes ${formatRegistrationDeadline(event.registration_deadline)}`
                                : "No registration deadline"}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() =>
                                  void handleStatusChange(
                                    event.id,
                                    event.status === "published" || event.status === "archived"
                                      ? "draft"
                                      : "published",
                                  )
                                }
                                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100"
                              >
                                {event.status === "archived"
                                  ? "Restore to draft"
                                  : event.status === "published"
                                    ? "Move to draft"
                                    : "Publish"}
                              </button>
                              {event.status !== "archived" ? (
                                <button
                                  onClick={() => setPendingEventAction({ event, action: "archive" })}
                                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100"
                                >
                                  Archive
                                </button>
                              ) : null}
                              <button
                                onClick={() => setPendingEventAction({ event, action: "delete" })}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-100"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
        </div>
      </main>

      {showForm ? (
        <div className="fixed inset-0 z-50 bg-slate-950/60 p-3 backdrop-blur-sm md:p-6">
          <div className="mx-auto flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 md:px-6">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {editingId ? "Edit Event" : "Create Event"}
                </p>
                <h2 className="mt-1.5 text-2xl font-black text-slate-800 md:text-[28px]">
                  {editingId ? "Edit Event" : "New Event"}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Fill the event details here. This is the same flow for both new and create event.
                </p>
              </div>
              <button
                onClick={requestCloseForm}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                aria-label="Close event form"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 md:px-6 md:py-5">
              <div className="space-y-4">
                  {formError ? (
                    <div
                      role="alert"
                      className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700"
                    >
                      {formError}
                    </div>
                  ) : null}
                  <Field label="Event Title">
                    <input
                      value={form.title}
                      onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                      className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                      placeholder="Founder networking night"
                    />
                  </Field>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <Field label="Event Category">
                      <select
                        value={form.eventType}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
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
                    <Field label="Status">
                      <select
                        value={form.status}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, status: event.target.value as VendorEventStatus }))
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
                  <div className="grid gap-4 xl:grid-cols-3">
                  <Field label="Timezone">
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <select
                        value={form.timezone}
                        onChange={(event) => setForm((prev) => ({ ...prev, timezone: event.target.value }))}
                        className="h-7 w-full border-0 bg-transparent p-0 text-sm font-bold outline-none"
                      >
                        {timezoneOptions.map((timezone) => (
                          <option key={timezone.value} value={timezone.value}>
                            {timezone.label.replace(" ? Your timezone", "")}
                          </option>
                        ))}
                      </select>
                    </div>
                  </Field>
                    <div className="xl:col-span-2">
                      <Field label="Location">
                        <div className="space-y-2">
                          <div className="flex flex-col gap-3 md:flex-row">
                            <div className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 transition focus-within:border-sky-500">
                              <select
                                value={form.venue}
                                onChange={(event) => {
                                  const nextValue = event.target.value;
                                  const matchedOption = locationOptions.find((option) => option.value === nextValue);
                                  if (matchedOption) {
                                    handleSelectLocationOption(matchedOption);
                                    return;
                                  }
                                  setForm((prev) => ({ ...prev, venue: nextValue }));
                                  setTempAddress(nextValue);
                                }}
                                className="h-7 w-full border-0 bg-transparent p-0 text-sm font-bold outline-none"
                              >
                                <option value="">Select location option</option>
                                {locationOptions
                                  .filter((option) => option.value.trim())
                                  .map((option) => (
                                    <option key={`${option.label}-${option.value}`} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                              </select>
                            </div>
                            <button
                              type="button"
                              onClick={openMapPicker}
                              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                            >
                              <MapPin className="h-4 w-4" />
                              Select on Map
                            </button>
                          </div>
                          <p className="text-xs font-medium text-slate-400">
                            Use the live map to pick the real event location.
                          </p>
                        </div>
                      </Field>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <Field label="Start Date">
                      <input
                        type="date"
                        value={form.eventDate}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            eventDate: event.target.value,
                            eventEndDate:
                              !prev.eventEndDate || prev.eventEndDate < event.target.value
                                ? event.target.value
                                : prev.eventEndDate,
                          }))
                        }
                        className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                      />
                    </Field>
                    <Field label="End Date">
                      <input
                        type="date"
                        min={form.eventDate || undefined}
                        value={form.eventEndDate}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, eventEndDate: event.target.value }))
                        }
                        className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                      />
                    </Field>
                    <Field label="Registration Deadline">
                      <input
                        type="date"
                        value={form.registrationDeadline}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, registrationDeadline: event.target.value }))
                        }
                        className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                      />
                    </Field>
                    <Field label="Ticket Price">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={form.ticketPrice}
                        onChange={(event) => setForm((prev) => ({ ...prev, ticketPrice: event.target.value }))}
                        className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                        placeholder="45"
                      />
                    </Field>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <Field label="Start Time">
                      <input
                        type="time"
                        value={form.startTime}
                        onChange={(event) => setForm((prev) => ({ ...prev, startTime: event.target.value }))}
                        className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                      />
                    </Field>
                    <Field label="End Time">
                      <input
                        type="time"
                        value={form.endTime}
                        onChange={(event) => setForm((prev) => ({ ...prev, endTime: event.target.value }))}
                        className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                      />
                    </Field>
                    <Field label="Capacity">
                      <input
                        type="number"
                        min="1"
                        value={form.capacity}
                        onChange={(event) => setForm((prev) => ({ ...prev, capacity: event.target.value }))}
                        className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500"
                        placeholder="300"
                      />
                    </Field>
                  </div>
                  <div className="grid gap-4 xl:grid-cols-3">
                  <Field label="Banner Image">
                    <div className="space-y-2">
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
                      {form.bannerImageUrl ? null : (
                        <button
                          type="button"
                          onClick={() => bannerInputRef.current?.click()}
                          className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                          aria-label="Upload banner"
                        >
                          <Plus className="h-4 w-4" />
                          Upload Banner
                        </button>
                      )}
                      {form.bannerImageUrl ? (
                        <div
                          className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50"
                          role="button"
                          tabIndex={0}
                          onClick={() => setShowBannerPreview(true)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setShowBannerPreview(true);
                            }
                          }}
                        >
                          <img
                            src={form.bannerImageUrl}
                            alt="Banner preview"
                            className="h-32 w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-slate-950/45 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100" />
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setForm((prev) => ({ ...prev, bannerImageUrl: "" }));
                              setShowBannerPreview(false);
                            }}
                            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-sm opacity-0 transition hover:bg-white group-hover:opacity-100 group-focus-within:opacity-100"
                            aria-label="Remove banner image"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              bannerInputRef.current?.click();
                            }}
                            className="absolute left-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-sm opacity-0 transition hover:bg-white group-hover:opacity-100 group-focus-within:opacity-100"
                            aria-label="Replace banner image"
                          >
                            <Upload className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs font-medium text-slate-400">
                          Upload a JPG or PNG banner image.
                        </p>
                      )}
                    </div>
                  </Field>
                    <div className="xl:col-span-2">
                      <Field label="Description">
                        <textarea
                          value={form.description}
                          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                          className="min-h-[112px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                          placeholder="Describe the event agenda, audience, and timing."
                        />
                      </Field>
                    </div>
                  </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6">
              <p
                aria-live="polite"
                className={cn(
                  "min-h-5 text-sm font-bold",
                  formError ? "text-rose-600" : "text-slate-400",
                )}
              >
                {formError || "Review the details, then save your event."}
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={requestCloseForm}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleOpenSaveConfirm}
                  disabled={saving}
                  className="rounded-xl bg-[#1e2a5e] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1a2552] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingId ? "Update Event" : "Save Event"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showMapModal ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Event Location
                </p>
                <h3 className="mt-2 text-2xl font-black text-slate-800">Select event location</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Click on the map or drag the marker to use the real event address.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMapModal(false)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                aria-label="Close map modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
                {mapError ? (
                  <div className="flex h-[420px] items-center justify-center px-6 text-center text-sm font-semibold text-rose-600">
                    {mapError}
                  </div>
                ) : (
                  <div id="event-google-map-element" className="h-[420px] w-full" />
                )}
              </div>
              <div className="rounded-[20px] border border-slate-100 bg-slate-50 px-5 py-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Selected Address</p>
                <p className="mt-2 text-sm font-semibold text-slate-700">
                  {tempAddress || "Select a point on the map to capture the event location."}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  {tempCoords.lat.toFixed(5)}, {tempCoords.lng.toFixed(5)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-5">
              <button
                type="button"
                onClick={() => setShowMapModal(false)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMapLocation}
                disabled={Boolean(mapError)}
                className="rounded-xl bg-[#1e2a5e] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1a2552] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Confirm Location
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showSaveConfirm ? (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="border-b border-slate-100 px-5 py-4 md:px-6">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                Confirm Event
              </p>
              <h3 className="mt-1.5 text-xl font-black text-slate-800">
                {editingId ? "Update this event?" : "Create this event?"}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {editingId
                  ? "The event endpoint will run only after you confirm this update."
                  : "The event create endpoint will run only after you confirm this new event."}
              </p>
            </div>
            <div className="px-5 py-4 md:px-6">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-sm font-extrabold text-slate-800">{form.title || "Untitled event"}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {form.eventDate} {form.startTime ? `• ${form.startTime}` : ""} {form.venue ? `• ${form.venue}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-5 py-4 md:px-6">
              <button
                type="button"
                onClick={() => setShowSaveConfirm(false)}
                disabled={saving}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={saving}
                className="rounded-xl bg-[#1e2a5e] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1a2552] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showDetailModal ? (
        <div className="fixed inset-0 z-[68] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 md:px-6">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Event Details
                </p>
                <h3 className="mt-1.5 text-2xl font-black text-slate-800">
                  {detailEvent?.title || "Loading event..."}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  All fields are loaded from the backend event record.
                </p>
              </div>
              <button
                type="button"
                onClick={closeDetailModal}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                aria-label="Close event details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {detailLoading ? (
              <div className="px-6 py-16 text-center text-sm font-medium text-slate-400">
                Loading event details...
              </div>
            ) : detailError ? (
              <div className="px-6 py-16 text-center text-sm font-bold text-rose-600">
                {detailError}
              </div>
            ) : detailEvent ? (
              <div className="grid gap-6 px-5 py-5 md:px-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-5">
                  <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={statusClass(detailEvent.status)}>{detailEvent.status}</span>
                      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
                        {detailEvent.event_type}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <DetailLine label="Start Date" value={detailEvent.event_date} />
                      <DetailLine label="End Date" value={detailEvent.end_date} />
                      <DetailLine label="Time" value={`${detailEvent.start_time} - ${detailEvent.end_time}`} />
                      <DetailLine label="Timezone" value={detailEvent.timezone || "Asia/Dhaka"} />
                      <DetailLine label="Location" value={detailEvent.venue || "Not set"} />
                      <DetailLine label="Capacity" value={String(detailEvent.capacity)} />
                      <DetailLine label="Ticket Price" value={formatMoney(detailEvent.ticket_price)} />
                      <DetailLine
                        label="Registration Deadline"
                        value={detailEvent.registration_deadline || "Not set"}
                      />
                      <DetailLine label="Active" value={detailEvent.active ? "Yes" : "No"} />
                    </div>
                  </div>
                  <div className="rounded-[24px] border border-slate-100 bg-white p-5">
                    <h4 className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">
                      Description
                    </h4>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {detailEvent.description || "No description provided."}
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="overflow-hidden rounded-[24px] border border-slate-100 bg-white">
                    {detailEvent.banner_image_url ? (
                      <img
                        src={detailEvent.banner_image_url}
                        alt={detailEvent.title}
                        className="h-64 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-64 items-center justify-center bg-slate-50 text-sm font-medium text-slate-400">
                        No banner image.
                      </div>
                    )}
                  </div>
                  <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-5">
                    <h4 className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">
                      Backend Data
                    </h4>
                    <p className="mt-3 text-sm text-slate-600">
                      The popup is populated from the backend event record so it matches the stored data exactly.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={showDiscardConfirm}
        title="Discard unsaved changes?"
        message="Your event changes have not been saved and will be lost."
        confirmLabel="Discard changes"
        destructive
        onClose={() => setShowDiscardConfirm(false)}
        onConfirm={resetForm}
      />

      <ConfirmDialog
        open={Boolean(pendingEventAction)}
        title={pendingEventAction?.action === "delete" ? "Delete this event?" : "Archive this event?"}
        message={pendingEventAction?.action === "delete"
          ? `"${pendingEventAction.event.title}" and its event record will be permanently deleted.`
          : `"${pendingEventAction?.event.title ?? "This event"}" will be hidden from active event listings.`}
        confirmLabel={pendingEventAction?.action === "delete" ? "Delete event" : "Archive event"}
        destructive={pendingEventAction?.action === "delete"}
        busy={eventActionBusy}
        onClose={() => setPendingEventAction(null)}
        onConfirm={() => void confirmEventAction()}
      />

      {showBannerPreview && form.bannerImageUrl ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 md:px-6">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Banner Preview</p>
                <p className="mt-1 text-sm text-slate-500">Full banner image inside the popup.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowBannerPreview(false)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                aria-label="Close banner preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="bg-slate-50 p-4 md:p-6">
              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
                <img
                  src={form.bannerImageUrl}
                  alt="Banner full preview"
                  className="max-h-[72vh] w-full object-contain bg-slate-50"
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function statusClass(status: VendorEventStatus) {
  return cn(
    "rounded-full px-3 py-1 text-xs font-bold capitalize",
    status === "published"
      ? "bg-emerald-100 text-emerald-700"
      : status === "archived"
        ? "bg-slate-200 text-slate-600"
        : status === "cancelled"
          ? "bg-rose-100 text-rose-700"
          : "bg-amber-100 text-amber-700",
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof CalendarDays;
  tone: "sky" | "emerald" | "amber" | "rose";
}) {
  const tones = {
    sky: "bg-sky-50 text-sky-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
  };

  return (
    <div className="flex items-center justify-between rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
        <p className="mt-2 text-3xl font-black text-slate-800">{value}</p>
      </div>
      <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", tones[tone])}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="block">
      <span className="mb-1.5 block text-[13px] font-bold text-slate-700">{label}</span>
      {children}
    </div>
  );
}

function Meta({
  icon: Icon,
  label,
}: {
  icon: typeof CalendarDays;
  label: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <span className="break-words">{label}</span>
    </div>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-bold text-slate-800 break-words">{value}</p>
    </div>
  );
}
