"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Upload,
  BadgePercent,
  CalendarPlus2,
  Utensils,
  Bed,
  Sparkles,
  Check,
  Map,
  MapPin
} from "lucide-react";
import { vendorGetPublicLegalDoc } from "@/lib/vendor-api";
import AuthFeedbackModal from "@/components/auth/auth-feedback-modal";
import {
  loadGoogleMaps,
  toGoogleLatLngLiteral,
  type GoogleAdvancedMarkerInstance,
  type GoogleGeocoderResult,
  type GoogleMapInstance,
  type GoogleMapMouseEvent,
} from "@/lib/google-maps";

const GOOGLE_MAPS_MAP_ID =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

type RegisterFormData = {
  businessName: string;
  ownerFullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  address: string;
  city: string;
  website: string;
  description: string;
  tradeLicenseNumber: string;
  agreeToTerms: boolean;
  categories: string[];
  businessLocationLabel: string;
};

type ApiErrorResponse = {
  detail?: string | { msg?: string }[] | null;
  message?: string;
};

type VendorRegistrationStatusResponse = {
  status?: string;
  kyc_status?: string;
  rejection_reason?: string | null;
};

type RegistrationCategoryOption = {
  id: string;
  title: string;
  desc: string;
};

type VendorRegistrationFormConfig = {
  categories: RegistrationCategoryOption[];
};

type MapCoords = {
  lat: number;
  lng: number;
};

type RegistrationDraft = {
  formData?: Partial<RegisterFormData>;
  tradeLicenseDocumentName?: string;
  ownerIdDocumentName?: string;
  tradeLicenseDocumentUrl?: string;
  ownerIdDocumentUrl?: string;
  tempCoords?: MapCoords;
  confirmedCoords?: MapCoords;
  tempAddress?: string;
  hasPinnedLocation?: boolean;
};

function isAccountConflictMessage(message: string) {
  return [
    "This email is already in use by another account.",
    "A service provider account for this email already exists and is pending admin approval.",
    "This email is already registered as a service provider.",
    "This service provider account was rejected. Contact support before registering again.",
    "This service provider account is blocked. Contact support.",
  ].includes(message);
}

const REGISTER_DRAFT_STORAGE_KEY = "vendor_registration_draft";

function getApiBaseUrl(): string {
  return "/api";
}

const initialFormData: RegisterFormData = {
  businessName: "",
  ownerFullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  address: "",
  city: "New York", // Defaults to pass validation
  website: "",
  description: "Activity Planner service provider business registration.", // Defaults to pass validation
  tradeLicenseNumber: "",
  agreeToTerms: false,
  categories: ["Restaurant"],
  businessLocationLabel: "",
};

const defaultLegalLabels = {
  terms: "Terms of Service",
  privacy: "Privacy Policy",
};

const defaultCategories: RegistrationCategoryOption[] = [
  {
    id: "Restaurant",
    title: "Restaurant",
    desc: "Manage reservations, tables, and fine dining menus effortlessly.",
  },
  {
    id: "Hotel",
    title: "Hotel",
    desc: "Streamline room bookings, guest services, and seasonal rates.",
  },
  {
    id: "Spa",
    title: "Spa",
    desc: "Automate treatment scheduling and therapist availability.",
  },
  {
    id: "Event",
    title: "Event",
    desc: "Create events and manage event booking requests.",
  },
];

function accountRegistrationCategories(
  categories: RegistrationCategoryOption[] | undefined,
) {
  const filtered = (categories ?? []).filter(
    (category) =>
      !["event venue", "cafe", "café"].includes(
        category.id.trim().toLowerCase(),
      ),
  );
  return filtered.length ? filtered : defaultCategories;
}

const textFieldNames = new Set<keyof Omit<RegisterFormData, "agreeToTerms">>([
  "businessName",
  "ownerFullName",
  "email",
  "phone",
  "password",
  "confirmPassword",
  "address",
  "city",
  "website",
  "description",
  "tradeLicenseNumber",
  "businessLocationLabel",
]);

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Restaurant: Utensils,
  Hotel: Bed,
  Spa: Sparkles,
  Event: CalendarPlus2,
  "Happy Hour": BadgePercent,
};

function getErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(error.message) as ApiErrorResponse;

    if (typeof parsed.detail === "string" && parsed.detail.trim()) {
      if (parsed.detail === "Invalid phone number format." || parsed.detail === "phone must be a phone number.") {
        return "Phone number must be 8 to 15 digits and can start with +.";
      }
      return parsed.detail;
    }

    if (Array.isArray(parsed.detail) && parsed.detail[0]?.msg) {
      return parsed.detail[0].msg;
    }

    if (typeof parsed.message === "string" && parsed.message.trim()) {
      return parsed.message;
    }
  } catch {
    return error.message || fallback;
  }

  return fallback;
}

function normalizePhone(value: string) {
  return value.replace(/[\s().-]/g, "").trim();
}

function sanitizePhoneInput(value: string) {
  const compact = value.replace(/[^\d+]/g, "");
  if (!compact) {
    return "";
  }
  if (compact.startsWith("+")) {
    return `+${compact.slice(1).replace(/\+/g, "")}`;
  }
  return compact.replace(/\+/g, "");
}

async function getExistingVendorMessage(emailOrPhone: string): Promise<string> {
  try {
    const response = await fetch(
      `${getApiBaseUrl()}/vendor/auth/registration-status?email_or_phone=${encodeURIComponent(emailOrPhone)}`,
      {
        method: "GET",
      },
    );

    if (!response.ok) {
      return "This email already exists. Please log in or use forgot password instead.";
    }

    const payload = (await response.json()) as VendorRegistrationStatusResponse;
    const status = (payload.status || "").toLowerCase();

    if (status === "pending_approval") {
      return "This service provider account already exists and is pending admin approval.";
    }

    if (status === "approved") {
      return "This email is already registered as a service provider. Please log in instead.";
    }

    if (status === "rejected") {
      return "This service provider account was rejected. Please contact support before registering again.";
    }

    if (status === "blocked") {
      return "This service provider account is blocked. Please contact support.";
    }
  } catch {
    return "This email already exists. Please log in or use forgot password instead.";
  }

  return "This email already exists. Please log in or use forgot password instead.";
}

function validateRegisterForm(formData: RegisterFormData) {
  if (formData.businessName.trim().length < 2) {
    return "Business name must be at least 2 characters.";
  }

  if (formData.ownerFullName.trim().length < 2) {
    return "Owner full name must be at least 2 characters.";
  }

  if (!formData.email.trim()) {
    return "Email address is required.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
    return "Enter a valid email address.";
  }

  if (formData.phone.trim()) {
    const normalizedPhone = normalizePhone(formData.phone);
    if (!/^\+?\d{8,15}$/.test(normalizedPhone)) {
      return "Phone number must be 8 to 15 digits and can start with +.";
    }
  }

  if (formData.password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (formData.address.trim().length < 5) {
    return "Address must be at least 5 characters.";
  }

  if (formData.city.trim().length < 2) {
    return "City must be at least 2 characters.";
  }

  if (formData.description.trim().length < 10) {
    return "Business description must be at least 10 characters.";
  }

  if (formData.tradeLicenseNumber.trim().length < 4) {
    return "Trade license number must be at least 4 characters.";
  }

  if (formData.categories.length === 0) {
    return "Select at least one business category.";
  }

  return null;
}

async function getPublicLegalDocTitle(docType: "terms" | "privacy") {
  const payload = await vendorGetPublicLegalDoc(docType);
  return (typeof payload.title === "string" && payload.title.trim())
    ? payload.title
    : defaultLegalLabels[docType];
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

async function postJson<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

async function uploadRegistrationDocument(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/vendor/auth/upload-document", {
    method: "POST",
    body: formData,
  });

  const result = (await response.json()) as {
    url?: string;
    detail?: string | { msg?: string }[];
    message?: string;
  };

  if (!response.ok || !result.url) {
    throw new Error(
      JSON.stringify({
        detail:
          typeof result.detail === "string"
            ? result.detail
            : result.message || "Failed to upload file.",
      }),
    );
  }

  return result.url;
}

export default function RegisterPage() {
  const router = useRouter();
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const [formData, setFormData] = useState(initialFormData);
  const [registrationConfig, setRegistrationConfig] = useState<VendorRegistrationFormConfig>({
    categories: defaultCategories,
  });
  const [legalLabels, setLegalLabels] = useState(defaultLegalLabels);
  const [submitMessage, setSubmitMessage] = useState("");
  const [showAccountHelp, setShowAccountHelp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tradeLicenseDocumentName, setTradeLicenseDocumentName] = useState("");
  const [ownerIdDocumentName, setOwnerIdDocumentName] = useState("");
  const [tradeLicenseDocumentUrl, setTradeLicenseDocumentUrl] = useState("");
  const [ownerIdDocumentUrl, setOwnerIdDocumentUrl] = useState("");
  const [isUploadingTradeLicense, setIsUploadingTradeLicense] = useState(false);
  const [isUploadingOwnerId, setIsUploadingOwnerId] = useState(false);

  // Interactive Map Selector modal states
  const [showMapModal, setShowMapModal] = useState(false);
  const [tempCoords, setTempCoords] = useState({ lat: 40.7128, lng: -74.0060 });
  const [tempAddress, setTempAddress] = useState("Manhattan, New York");
  const [confirmedCoords, setConfirmedCoords] = useState({ lat: 40.7128, lng: -74.0060 });
  const [hasPinnedLocation, setHasPinnedLocation] = useState(false);
  const mapSeedRef = useRef({
    address: formData.address,
    coords: tempCoords,
  });
  mapSeedRef.current = {
    address: formData.address,
    coords: tempCoords,
  };

  // Geocode typed address to update background preview map in real-time
  useEffect(() => {
    if (!googleMapsApiKey || formData.address.trim().length <= 3 || hasPinnedLocation) return;

    let cancelled = false;
    const delayDebounce = setTimeout(() => {
      void loadGoogleMaps(googleMapsApiKey)
        .then((googleMaps) => {
          if (cancelled) return;
          const geocoder = new googleMaps.Geocoder();
          geocoder.geocode(
            { address: formData.address },
            (results: GoogleGeocoderResult[] | null, status: string) => {
              const location = results?.[0]?.geometry?.location;
              if (cancelled || status !== "OK" || !location) return;
              const coords = {
                lat: Number(location.lat()),
                lng: Number(location.lng()),
              };
              setConfirmedCoords(coords);
              setTempCoords(coords);
              setTempAddress(results?.[0]?.formatted_address || formData.address);
            },
          );
        })
        .catch(() => undefined);
    }, 1200);

    return () => {
      cancelled = true;
      clearTimeout(delayDebounce);
    };
  }, [formData.address, googleMapsApiKey, hasPinnedLocation]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const savedDraft = sessionStorage.getItem(REGISTER_DRAFT_STORAGE_KEY);
    if (!savedDraft) {
      return;
    }

    try {
      const parsed = JSON.parse(savedDraft) as RegistrationDraft;
      const restoreTimeout = window.setTimeout(() => {
        if (parsed.formData) {
          setFormData((prev) => ({ ...prev, ...parsed.formData }));
        }
        setTradeLicenseDocumentName(parsed.tradeLicenseDocumentName ?? "");
        setOwnerIdDocumentName(parsed.ownerIdDocumentName ?? "");
        setTradeLicenseDocumentUrl(parsed.tradeLicenseDocumentUrl ?? "");
        setOwnerIdDocumentUrl(parsed.ownerIdDocumentUrl ?? "");
        if (parsed.tempCoords) {
          setTempCoords(parsed.tempCoords);
        }
        if (parsed.confirmedCoords) {
          setConfirmedCoords(parsed.confirmedCoords);
        }
        if (parsed.tempAddress) {
          setTempAddress(parsed.tempAddress);
        }
        setHasPinnedLocation(Boolean(parsed.hasPinnedLocation));
      }, 0);
      return () => window.clearTimeout(restoreTimeout);
    } catch {
      sessionStorage.removeItem(REGISTER_DRAFT_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadRegistrationConfig() {
      try {
        const config = await getJson<VendorRegistrationFormConfig>("/vendor/auth/registration-form-config");
        if (!mounted) {
          return;
        }
        setRegistrationConfig({
          ...config,
          categories: accountRegistrationCategories(config.categories),
        });
      } catch {
        if (mounted) {
          setRegistrationConfig((prev) => prev);
        }
      }
    }

    async function loadLegalLabels() {
      try {
        const [termsTitle, privacyTitle] = await Promise.all([
          getPublicLegalDocTitle("terms"),
          getPublicLegalDocTitle("privacy"),
        ]);

        if (!mounted) {
          return;
        }

        setLegalLabels({
          terms: termsTitle,
          privacy: privacyTitle,
        });
      } catch {
        if (mounted) {
          setLegalLabels(defaultLegalLabels);
        }
      }
    }

    void loadRegistrationConfig();
    void loadLegalLabels();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    sessionStorage.setItem(
      REGISTER_DRAFT_STORAGE_KEY,
      JSON.stringify({
        formData,
        tradeLicenseDocumentName,
        ownerIdDocumentName,
        tradeLicenseDocumentUrl,
        ownerIdDocumentUrl,
        tempCoords,
        confirmedCoords,
        tempAddress,
        hasPinnedLocation,
      }),
    );
  }, [
    formData,
    tradeLicenseDocumentName,
    ownerIdDocumentName,
    tradeLicenseDocumentUrl,
    ownerIdDocumentUrl,
    tempCoords,
    confirmedCoords,
    tempAddress,
    hasPinnedLocation,
  ]);

  useEffect(() => {
    if (!showMapModal || !googleMapsApiKey) return;

    let cancelled = false;
    let map: GoogleMapInstance | undefined;
    let marker: GoogleAdvancedMarkerInstance | undefined;
    void loadGoogleMaps(googleMapsApiKey)
      .then((googleMaps) => {
      if (cancelled) return;
      const mapDiv = document.getElementById("google-map-element");
      if (!mapDiv) return;

      const mapSeed = mapSeedRef.current;
      const initialCenter = mapSeed.coords;
      map = new googleMaps.Map(mapDiv, {
        center: initialCenter,
        zoom: 14,
        mapId: GOOGLE_MAPS_MAP_ID,
        disableDefaultUI: false,
        zoomControl: true,
      });

      marker = new googleMaps.AdvancedMarkerElement({
        position: initialCenter,
        map,
        gmpDraggable: true,
      });
      const geocoder = new googleMaps.Geocoder();
      const reverseGeocode = (position: MapCoords, fallbackLabel: string) => {
        geocoder.geocode(
          { location: position },
          (results: GoogleGeocoderResult[] | null, status: string) => {
            if (cancelled) return;
            setTempAddress(
              status === "OK" && results?.[0]?.formatted_address
                ? results[0].formatted_address
                : fallbackLabel,
            );
          },
        );
      };
      const updateLocation = (position: MapCoords) => {
        if (marker) marker.position = position;
        setTempCoords(position);
        reverseGeocode(
          position,
          `Coordinate (${position.lat.toFixed(4)}, ${position.lng.toFixed(4)})`,
        );
      };

      const tryGeolocation = () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              };
              map?.setCenter(pos);
              if (marker) marker.position = pos;
              setTempCoords(pos);
              reverseGeocode(
                pos,
                `Current Location (${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)})`,
              );
            },
            () => {
              // Geolocation failed or denied
            }
          );
        }
      };

      // Check if user has entered a business address first
      if (mapSeed.address.trim().length > 3) {
        geocoder.geocode({ address: mapSeed.address }, (results: GoogleGeocoderResult[] | null, status: string) => {
          const location = results?.[0]?.geometry?.location;
          if (status === "OK" && location) {
            const position = {
              lat: Number(location.lat()),
              lng: Number(location.lng()),
            };
            map?.setCenter(position);
            if (marker) marker.position = position;
            setTempCoords(position);
            setTempAddress(results?.[0]?.formatted_address || mapSeed.address);
          } else {
            tryGeolocation();
          }
        });
      } else {
        tryGeolocation();
      }

      // Handle map clicks
      map.addListener("click", (event: GoogleMapMouseEvent) => {
        const position = toGoogleLatLngLiteral(event.latLng);
        if (position) updateLocation(position);
      });

      // Handle marker drags
      marker.addListener("dragend", () => {
        const position = toGoogleLatLngLiteral(marker?.position);
        if (position) updateLocation(position);
      });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      const googleMaps = window.google?.maps;
      if (googleMaps?.event && map) googleMaps.event.clearInstanceListeners(map);
      if (googleMaps?.event && marker) googleMaps.event.clearInstanceListeners(marker);
      if (marker) marker.map = null;
    };
  }, [showMapModal, googleMapsApiKey]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name } = e.target;

    setSubmitMessage("");
    setShowAccountHelp(false);

    if (name === "agreeToTerms" && e.target instanceof HTMLInputElement) {
      const inputEl = e.target;
      setFormData((prev) => ({ ...prev, agreeToTerms: inputEl.checked }));
      return;
    }

    if (!textFieldNames.has(name as keyof Omit<RegisterFormData, "agreeToTerms">)) {
      return;
    }

    const nextValue = name === "phone" ? sanitizePhoneInput(e.target.value) : e.target.value;
    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
    }));
  };

  const handleFileChange =
    (field: "tradeLicenseDocument" | "ownerIdDocument") =>
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];

      if (!file) {
        return;
      }

      setSubmitMessage("");

      if (field === "tradeLicenseDocument") {
        setTradeLicenseDocumentName(file.name);
        setTradeLicenseDocumentUrl("");
        setIsUploadingTradeLicense(true);
      } else {
        setOwnerIdDocumentName(file.name);
        setOwnerIdDocumentUrl("");
        setIsUploadingOwnerId(true);
      }

      try {
        const uploadedUrl = await uploadRegistrationDocument(file);

        if (field === "tradeLicenseDocument") {
          setTradeLicenseDocumentUrl(uploadedUrl);
          return;
        }

        setOwnerIdDocumentUrl(uploadedUrl);
      } catch (error) {
        if (field === "tradeLicenseDocument") {
          setTradeLicenseDocumentName("");
        } else {
          setOwnerIdDocumentName("");
        }

        setSubmitMessage(
          getErrorMessage(error, "Failed to upload the selected file."),
        );
      } finally {
        if (field === "tradeLicenseDocument") {
          setIsUploadingTradeLicense(false);
        } else {
          setIsUploadingOwnerId(false);
        }
      }
    };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationError = validateRegisterForm(formData);

    if (validationError) {
      setSubmitMessage(validationError);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setSubmitMessage("Passwords do not match.");
      return;
    }

    if (!formData.agreeToTerms) {
      setSubmitMessage("You must accept the terms to continue.");
      return;
    }

    if (isUploadingTradeLicense || isUploadingOwnerId) {
      setSubmitMessage("Please wait for the document uploads to finish.");
      return;
    }

    if (!tradeLicenseDocumentUrl || !ownerIdDocumentUrl) {
      setSubmitMessage("Upload both verification documents before continuing.");
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage("");
    setShowAccountHelp(false);

    try {
      const normalizedPhone = normalizePhone(formData.phone);
      const requestCodeResult = await postJson<{
        validation_code?: string | null;
      }>("/vendor/auth/register/request-code", {
        email_or_phone: formData.email.trim(),
      });

      sessionStorage.setItem(
        "pending_vendor_registration",
        JSON.stringify({
          business_name: formData.businessName.trim(),
          owner_full_name: formData.ownerFullName.trim(),
          email_or_phone: formData.email.trim(),
          phone: normalizedPhone || null,
          address: formData.address.trim(),
          city: formData.city.trim(),
          website: formData.website.trim() || null,
          business_description: formData.description.trim(),
          trade_license_number: formData.tradeLicenseNumber.trim(),
          trade_license_document_url: tradeLicenseDocumentUrl,
          owner_manager_id_document_url: ownerIdDocumentUrl,
          terms_accepted: formData.agreeToTerms,
          password: formData.password,
          confirm_password: formData.confirmPassword,
          debug_code: requestCodeResult.validation_code ?? null,
          category: formData.categories[0],
          categories: formData.categories,
          event_types: null,
          venue_capacity: null,
          ticket_pricing_type: null,
          business_location_label:
            formData.businessLocationLabel.trim()
              ? formData.businessLocationLabel.trim()
              : null,
          equipment_availability: null,
        }),
      );
      router.push(
        `/auth/verify-otp?mode=register&contact=${encodeURIComponent(formData.email.trim())}`,
      );
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Registration failed.");

      if (isAccountConflictMessage(errorMessage)) {
        setShowAccountHelp(true);
        setSubmitMessage(await getExistingVendorMessage(formData.email.trim()));
      } else {
        setSubmitMessage(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmMapLocation = () => {
    setFormData((prev) => ({
      ...prev,
      businessLocationLabel: `${tempAddress} (${tempCoords.lat.toFixed(4)}, ${tempCoords.lng.toFixed(4)})`,
    }));
    setConfirmedCoords({ lat: tempCoords.lat, lng: tempCoords.lng });
    setHasPinnedLocation(true);
    setShowMapModal(false);
  };

  return (
    <>
      <AuthFeedbackModal
        message={submitMessage}
        onClose={() => {
          setSubmitMessage("");
          setShowAccountHelp(false);
        }}
        title={showAccountHelp ? "Registration blocked" : "Please check this"}
        actions={
          showAccountHelp ? (
            <>
              <Link
                href="/auth/login"
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Log in
              </Link>
              <Link
                href="/auth/forgot-password"
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Reset password
              </Link>
            </>
          ) : undefined
        }
      />

      {/* Map Selector Modal */}
      {showMapModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Map className="h-5 w-5 text-blue-600" />
                Select Business Location
              </h3>
              <button
                type="button"
                onClick={() => setShowMapModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                Cancel
              </button>
            </div>
            {/* Real Google Map Element inside Modal */}
            <div className="bg-slate-100 h-96 relative flex flex-col items-center justify-center overflow-hidden">
              {googleMapsApiKey ? (
                <div id="google-map-element" className="w-full h-full" />
              ) : (
                /* Fallback Map Mock */
                <div className="w-full h-full relative flex items-center justify-center p-4">
                  <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />
                  <div className="absolute top-1/3 left-1/4 h-24 w-40 bg-blue-200/40 rounded-full blur-xl animate-pulse" />
                  <div className="absolute bottom-1/4 right-1/4 h-24 w-48 bg-emerald-200/30 rounded-full blur-xl" />
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/60" />
                  <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-white/60" />

                  <div className="relative bg-white/95 backdrop-blur px-5 py-3 rounded-2xl shadow-xl border border-slate-100/50 flex flex-col items-center gap-1 z-10 max-w-[85%] text-center">
                    <MapPin className="h-7 w-7 text-red-500 animate-bounce" />
                    <span className="text-xs font-black text-slate-800">{tempAddress}</span>
                    <span className="text-[10px] text-slate-400 font-bold tracking-wider">
                      Lat: {tempCoords.lat.toFixed(4)}, Lng: {tempCoords.lng.toFixed(4)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setTempCoords({ lat: 40.7306, lng: -73.9352 });
                      setTempAddress("Brooklyn, New York");
                    }}
                    className="absolute top-12 right-12 w-3 h-3 bg-red-400 border border-white rounded-full animate-ping cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setTempCoords({ lat: 40.7580, lng: -73.9855 });
                      setTempAddress("Times Square, NY");
                    }}
                    className="absolute bottom-16 left-16 w-3 h-3 bg-blue-400 border border-white rounded-full animate-pulse cursor-pointer"
                  />
                </div>
              )}
            </div>
            <div className="p-6 bg-slate-50 flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-800 line-clamp-1 max-w-[280px]">
                  {tempAddress}
                </span>
                <span className="text-[9px] text-slate-450 font-bold tracking-wider">
                  Lat: {tempCoords.lat.toFixed(4)}, Lng: {tempCoords.lng.toFixed(4)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleConfirmMapLocation}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-2xl shadow-lg transition"
              >
                Confirm Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container matches light lavender/blueish white color from screenshot */}
      <div className="w-full min-h-screen bg-white font-sans">
        {/* Top Header Row with Login button matching screenshot exactly */}
        <div className="w-full flex items-center justify-end px-3 py-3">
          <Link
            href="/auth/login"
            className="bg-[#0b122f] hover:bg-[#1a2552] text-white px-7 py-2.5 rounded-full text-xs font-bold shadow-md transition-all active:scale-[0.98]"
          >
            Login
          </Link>
        </div>

        <div className="w-full space-y-12">

          {/* Header Title with correct spacing and subtext */}
          <div className="text-center space-y-3">
            <h1 className="text-4xl md:text-5xl font-black text-[#1a2552] tracking-tight">
              Register Your Business
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium max-w-xl mx-auto leading-relaxed">
              Join the platform and reach thousands of customers worldwide with our premium concierge business suite.
            </p>
          </div>

          {/* Form starts here */}
          <form className="space-y-8 animate-fadeIn" onSubmit={handleSubmit}>

            {/* Choose Your Category header - sits directly on light purple background */}
            <div className="space-y-4 px-8 md:px-12">
              <h2 className="text-[#1a2552] text-sm font-black uppercase tracking-wider ml-1">
                Choose Your Category
              </h2>

              {/* Category cards 3-column layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {registrationConfig.categories.map((cat) => {
                  const Icon = categoryIcons[cat.id] || MapPin;
                  const isSelected = formData.categories.includes(cat.id);
                  return (
                    <div
                      key={cat.id}
                      onClick={() => {
                        setSubmitMessage("");
                        setFormData((prev) => {
                          const categories = prev.categories.includes(cat.id)
                            ? prev.categories.filter((item) => item !== cat.id)
                            : [...prev.categories, cat.id];
                          return { ...prev, categories };
                        });
                      }}
                      className={`relative p-6 rounded-[24px] border cursor-pointer transition-all duration-300 flex flex-col justify-between h-40 ${
                        isSelected
                          ? "border-[#3b82f6] bg-[#f4f8ff] shadow-lg shadow-blue-500/5"
                          : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1] hover:shadow-sm"
                      }`}
                    >
                      <div>
                        {/* Icons outline style matching screenshot */}
                        <div className={`h-11 w-11 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                          isSelected ? "text-[#3b82f6]" : "text-[#1a2552]"
                        }`}>
                          <Icon className="h-6 w-6 stroke-[1.8]" />
                        </div>
                        <h3 className="text-sm font-black text-slate-850 mb-1">{cat.title}</h3>
                        <p className="text-[11px] text-slate-400 font-bold leading-normal">{cat.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Main white card container wrapping inner forms */}
            <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-2xl shadow-slate-100 border border-slate-100/30 space-y-12">

              {/* Split screen content layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

                {/* Left side: Business Info & Verification */}
                <div className="lg:col-span-7 space-y-8">

                  {/* Business Information Section */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-black text-[#1a2552] mb-4">
                      Business Information
                    </h3>
                    <div className="space-y-4">
                      <input
                        type="text"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleInputChange}
                        placeholder="Business Name"
                        className="w-full bg-white border border-[#e2e8f0] rounded-full py-4.5 px-6 text-xs font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-slate-300 transition placeholder:text-slate-450"
                      />
                      <input
                        type="text"
                        name="ownerFullName"
                        value={formData.ownerFullName}
                        onChange={handleInputChange}
                        placeholder="Owner Name"
                        className="w-full bg-white border border-[#e2e8f0] rounded-full py-4.5 px-6 text-xs font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-slate-300 transition placeholder:text-slate-450"
                      />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Business Email"
                        className="w-full bg-white border border-[#e2e8f0] rounded-full py-4.5 px-6 text-xs font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-slate-300 transition placeholder:text-slate-450"
                      />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Phone Number"
                        className="w-full bg-white border border-[#e2e8f0] rounded-full py-4.5 px-6 text-xs font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-slate-300 transition placeholder:text-slate-450"
                      />

                      {/* Password side-by-side matching screenshot */}
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="Password"
                          className="w-full bg-white border border-[#e2e8f0] rounded-full py-4.5 px-6 text-xs font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-slate-300 transition placeholder:text-slate-450"
                        />
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          placeholder="Confirm"
                          className="w-full bg-white border border-[#e2e8f0] rounded-full py-4.5 px-6 text-xs font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-slate-300 transition placeholder:text-slate-450"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Verification Section */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-black text-[#1a2552] mb-4">
                      Verification
                    </h3>

                    <input
                      type="text"
                      name="tradeLicenseNumber"
                      value={formData.tradeLicenseNumber}
                      onChange={handleInputChange}
                      placeholder="Trade License Number"
                      className="w-full bg-white border border-[#e2e8f0] rounded-full py-4.5 px-6 text-xs font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-slate-300 transition placeholder:text-slate-450"
                    />

                    {/* Dashed upload buttons next to each other */}
                    <div className="grid grid-cols-2 gap-4">
                      <label className="border border-dashed border-[#cbd5e1] rounded-3xl p-6 flex flex-col items-center justify-center gap-2 bg-white hover:bg-slate-50/50 transition cursor-pointer select-none">
                        <FileText className="h-5 w-5 text-slate-400" />
                        <span className="text-[10px] font-black text-slate-500 text-center uppercase tracking-wider">
                          {isUploadingTradeLicense
                            ? "Uploading..."
                            : tradeLicenseDocumentUrl
                              ? tradeLicenseDocumentName || "Uploaded"
                              : "Trade License Upload"}
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileChange("tradeLicenseDocument")}
                          className="sr-only"
                        />
                      </label>
                      <label className="border border-dashed border-[#cbd5e1] rounded-3xl p-6 flex flex-col items-center justify-center gap-2 bg-white hover:bg-slate-50/50 transition cursor-pointer select-none">
                        <Upload className="h-5 w-5 text-slate-400" />
                        <span className="text-[10px] font-black text-slate-500 text-center uppercase tracking-wider">
                          {isUploadingOwnerId
                            ? "Uploading..."
                            : ownerIdDocumentUrl
                              ? ownerIdDocumentName || "Uploaded"
                              : "ID Verification Upload"}
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileChange("ownerIdDocument")}
                          className="sr-only"
                        />
                      </label>
                    </div>

                    {/* Address field styled identically to other text inputs */}
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Business Address"
                      className="w-full bg-white border border-[#e2e8f0] rounded-full py-4.5 px-6 text-xs font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-slate-200 transition placeholder:text-slate-450"
                    />
                  </div>

                </div>

                {/* Right side: Business Location Card */}
                <div className="lg:col-span-5 bg-[#f4f5f9] rounded-[32px] p-6 md:p-8 border border-slate-100/30 space-y-6">

                    {/* Location Header */}
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-5 w-5 text-blue-500" />
                      <h3 className="text-base font-black text-[#1a2552]">Business Location</h3>
                    </div>
                    <p className="text-xs font-bold text-slate-400 leading-relaxed">
                      Registration only captures the fixed business location. Event name, event details, date/time,
                      and registration settings are created later from the dashboard.
                    </p>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block ml-1">Location Preview</label>
                      <div className="bg-[#e2e4ed]/70 rounded-2xl h-36 relative flex flex-col items-center justify-center overflow-hidden border border-slate-200/40">
                        <iframe
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${confirmedCoords.lng - 0.015}%2C${confirmedCoords.lat - 0.008}%2C${confirmedCoords.lng + 0.015}%2C${confirmedCoords.lat + 0.008}&layer=mapnik&marker=${confirmedCoords.lat}%2C${confirmedCoords.lng}`}
                          className="absolute inset-0 w-full h-full border-0 opacity-75 pointer-events-none"
                          title="Real Map View"
                        />
                        <div className="absolute inset-0 bg-slate-900/5 pointer-events-none" />

                        {formData.businessLocationLabel ? (
                          <div className="relative text-center flex flex-col items-center gap-1 z-10 bg-white/90 backdrop-blur px-5 py-3 rounded-2xl border border-slate-100 shadow-md">
                            <Check className="h-5 w-5 text-emerald-600 bg-emerald-50 p-1 rounded-full" />
                            <span className="text-[10px] font-black text-slate-700 max-w-[180px] truncate block">
                              {formData.businessLocationLabel}
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowMapModal(true)}
                              className="text-[9px] text-blue-600 hover:underline font-black mt-1 uppercase tracking-wider"
                            >
                              Change Location
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowMapModal(true)}
                            className="bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold px-5 py-3 rounded-full shadow-lg border border-slate-100/50 transition z-10"
                          >
                            Open Map Selector
                          </button>
                        )}
                      </div>
                    <input
                      type="text"
                      name="businessLocationLabel"
                      value={formData.businessLocationLabel}
                      onChange={handleInputChange}
                      placeholder="Location label or landmark"
                      className="w-full bg-white border border-[#e2e8f0] rounded-full py-4 px-6 text-xs font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition placeholder:text-slate-350"
                    />
                      <p className="text-[11px] font-bold text-slate-400 leading-relaxed">
                        Use this for a branch label, landmark, or public-facing location note. Events themselves are created later in the dashboard.
                      </p>
                    </div>

                  </div>

              </div>

              {/* Terms of Service & Submission Button */}
              <div className="space-y-6 pt-6 border-t border-slate-100 flex flex-col items-center">
                <div className="flex items-center gap-3 w-full justify-start">
                  <input
                    id="agreeToTerms"
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleInputChange}
                    className="h-5 w-5 rounded-lg border-2 border-slate-200 text-blue-600 focus:ring-blue-500 cursor-pointer mt-0.5"
                  />
                  <p className="text-xs font-bold text-slate-400 leading-normal">
                    <label htmlFor="agreeToTerms" className="cursor-pointer select-none">
                      I agree to the{" "}
                    </label>
                    <Link href="/legal/terms" className="font-black text-slate-655 hover:text-blue-600 transition">
                      {legalLabels.terms}
                    </Link>{" "}
                    and{" "}
                    <Link href="/legal/privacy" className="font-black text-slate-655 hover:text-blue-600 transition">
                      {legalLabels.privacy}
                    </Link>
                    .
                  </p>
                </div>

                {/* Wide navy button with shadow, centered */}
                <div className="w-full max-w-lg text-center space-y-4 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#1b2554] hover:bg-[#131b40] disabled:opacity-60 text-white py-4.5 rounded-full text-xs font-black tracking-wider uppercase shadow-xl shadow-[#1b2554]/15 transition-all active:scale-[0.98]"
                  >
                    {isSubmitting ? "Creating Business Account..." : "Create Business Account"}
                  </button>

                  <p className="text-xs font-bold text-slate-400">
                    Already have an account?{" "}
                    <Link href="/auth/login" className="text-[#1b2554] hover:underline font-black">
                      Login
                    </Link>
                  </p>
                </div>
              </div>

            </div>
          </form>
        </div>

        {/* Footer block matches screenshot links */}
        <div className="w-full max-w-[1100px] border-t border-slate-200 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-slate-400 font-bold mx-auto pb-16">
          <span className="text-xs font-black text-slate-800">Activity Planner</span>
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/legal/privacy" className="hover:underline">Privacy Policy</Link>
            <Link href="/legal/terms" className="hover:underline">Terms of Service</Link>
            <Link href="/auth/login" className="hover:underline">Partner Login</Link>
            <Link href="/auth/forgot-password" className="hover:underline">Account Help</Link>
          </div>
          <span>© {new Date().getFullYear()} Activity Planner. All rights reserved.</span>
        </div>
      </div>
    </>
  );
}
