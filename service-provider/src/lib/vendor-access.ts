"use client";

import {
  BarChart3,
  BadgePercent,
  CalendarRange,
  CalendarPlus2,
  Hotel,
  LayoutDashboard,
  BriefcaseBusiness,
  Settings,
  Star,
  Tag,
  UserCircle2,
  UtensilsCrossed,
  Waves,
  type LucideIcon,
} from "lucide-react";

export const VENDOR_CATEGORY_CACHE_KEY = "vendor_categories";
export const VENDOR_CATEGORIES_UPDATED_EVENT = "vendor-categories-updated";

export type VendorCategory =
  | "Restaurant"
  | "Hotel"
  | "Spa"
  | "Event"
  | "Happy Hour";

export type SidebarNavItem = {
  name: string;
  icon: LucideIcon;
  href: string;
};

const CATEGORY_VALUES: VendorCategory[] = [
  "Restaurant",
  "Hotel",
  "Spa",
  "Event",
  "Happy Hour",
];

const ALWAYS_VISIBLE_NAV_ITEMS: SidebarNavItem[] = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { name: "Customers", icon: UserCircle2, href: "/customers" },
  { name: "Operations", icon: BriefcaseBusiness, href: "/operations" },
  { name: "Promotions", icon: Tag, href: "/promotions" },
  { name: "Analytics", icon: BarChart3, href: "/analytics" },
  { name: "Loyalty Program", icon: UserCircle2, href: "/loyalty" },
  { name: "Reviews", icon: Star, href: "/reviews" },
  { name: "Settings", icon: Settings, href: "/settings" },
];

const CATEGORY_NAV_ITEMS: Record<VendorCategory, SidebarNavItem[]> = {
  Restaurant: [
    {
      name: "Restaurant Bookings",
      icon: UtensilsCrossed,
      href: "/restaurant-bookings",
    },
    {
      name: "Restaurant / Services",
      icon: UtensilsCrossed,
      href: "/services",
    },
  ],
  Hotel: [
    { name: "Hotel Bookings", icon: CalendarRange, href: "/hotel-bookings" },
    { name: "Hotel / Services", icon: Hotel, href: "/hotel-services" },
  ],
  Spa: [
    { name: "Spa Bookings", icon: CalendarRange, href: "/spa-bookings" },
    { name: "Spa / Services", icon: Waves, href: "/spa-services" },
  ],
  Event: [
    { name: "Event Management", icon: CalendarPlus2, href: "/events" },
    { name: "Event Bookings", icon: CalendarRange, href: "/event-bookings" },
  ],
  "Happy Hour": [
    {
      name: "Happy Hour Management",
      icon: BadgePercent,
      href: "/happy-hours",
    },
  ],
};

const CATEGORY_ROUTE_PREFIXES: Record<VendorCategory, string[]> = {
  Restaurant: ["/restaurant-bookings", "/services"],
  Hotel: ["/hotel-bookings", "/hotel-services"],
  Spa: ["/spa-bookings", "/spa-services"],
  Event: ["/events", "/event-bookings"],
  "Happy Hour": ["/happy-hours"],
};

const SHARED_ALLOWED_PREFIXES = [
  "/dashboard",
  "/promotions",
  "/analytics",
  "/loyalty",
  "/reviews",
  "/settings",
  "/profile",
  "/customers",
  "/operations",
  "/notifications",
];

function normalizeCategory(value: unknown): VendorCategory | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return CATEGORY_VALUES.find((category) => category.toLowerCase() === trimmed.toLowerCase()) ?? null;
}

export function extractVendorCategories(input: unknown): VendorCategory[] {
  const values = Array.isArray(input) ? input : [input];
  const normalized = values
    .map(normalizeCategory)
    .filter((value, index, array): value is VendorCategory => {
      return value !== null && array.indexOf(value) === index;
    });
  return normalized.length > 0 ? normalized : ["Restaurant"];
}

export function readCachedVendorCategories(): VendorCategory[] {
  if (typeof window === "undefined") {
    return ["Restaurant"];
  }
  try {
    const raw = localStorage.getItem(VENDOR_CATEGORY_CACHE_KEY);
    if (!raw) {
      return ["Restaurant"];
    }
    return extractVendorCategories(JSON.parse(raw));
  } catch {
    return ["Restaurant"];
  }
}

export function cacheVendorCategories(categories: unknown): VendorCategory[] {
  const normalized = extractVendorCategories(categories);
  if (typeof window !== "undefined") {
    localStorage.setItem(VENDOR_CATEGORY_CACHE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(
      new CustomEvent(VENDOR_CATEGORIES_UPDATED_EVENT, {
        detail: normalized,
      }),
    );
  }
  return normalized;
}

export function clearCachedVendorCategories(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(VENDOR_CATEGORY_CACHE_KEY);
    window.dispatchEvent(
      new CustomEvent(VENDOR_CATEGORIES_UPDATED_EVENT, {
        detail: ["Restaurant"],
      }),
    );
  }
}

export function getSidebarItemsForCategories(
  categories: VendorCategory[],
): SidebarNavItem[] {
  const categoryItems = [
    ...categories.flatMap((category) => CATEGORY_NAV_ITEMS[category]),
    ...CATEGORY_NAV_ITEMS["Happy Hour"],
  ];
  const seen = new Set<string>();
  return [...ALWAYS_VISIBLE_NAV_ITEMS, ...categoryItems].filter((item) => {
    if (seen.has(item.href)) {
      return false;
    }
    seen.add(item.href);
    return true;
  });
}

export function isRouteAllowedForCategories(
  pathname: string,
  categories: VendorCategory[],
): boolean {
  if (SHARED_ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }
  if (CATEGORY_ROUTE_PREFIXES["Happy Hour"].some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }
  return categories.some((category) =>
    CATEGORY_ROUTE_PREFIXES[category].some((prefix) => pathname.startsWith(prefix)),
  );
}

export function getFallbackRouteForCategories(
  categories: VendorCategory[],
): string {
  for (const category of categories) {
    const [firstItem] = CATEGORY_NAV_ITEMS[category];
    if (firstItem) {
      return firstItem.href;
    }
  }
  return "/dashboard";
}
