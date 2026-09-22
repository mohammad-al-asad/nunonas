export type DashboardHeader = {
  title: string;
  description?: string;
};

const EXACT_HEADERS: Record<string, DashboardHeader> = {
  "/dashboard": {
    title: "Business Overview",
    description: "Live activity and performance across your enabled services.",
  },
  "/analytics": {
    title: "Business Analytics",
    description: "Live metrics from the vendor analytics endpoints.",
  },
  "/customers": {
    title: "Customers",
    description: "Search and manage guests who have interacted with your business.",
  },
  "/operations": {
    title: "Operations",
    description: "Manage the day-to-day work for your enabled business categories.",
  },
  "/events": {
    title: "Event Management",
    description: "Create, publish, and manage all vendor events.",
  },
  "/events/new": {
    title: "Create Event",
    description: "Add event details, scheduling, venue, capacity, and pricing.",
  },
  "/happy-hours": {
    title: "Happy Hour Management",
    description: "Create and manage recurring Happy Hour offers separately from events.",
  },
  "/event-bookings": {
    title: "Event Bookings",
    description: "View and manage booking requests for every event.",
  },
  "/hotel-bookings": {
    title: "Hotel Bookings",
    description: "Manage arrivals, stays, rooms, and booking status.",
  },
  "/hotel-services": {
    title: "Hotel Properties & Services",
    description: "Manage room inventory and guest-facing hotel services.",
  },
  "/hotel-services/add": {
    title: "Add Hotel Room",
    description: "Create a room listing with availability, amenities, and pricing.",
  },
  "/hotel-services/add-service": {
    title: "Add Hotel Service",
    description: "Create a guest-facing service for your hotel.",
  },
  "/loyalty": {
    title: "Loyalty Points Settings",
    description: "Configure how customers earn and spend rewards.",
  },
  "/notifications": {
    title: "Notifications",
    description: "Booking, review, and platform updates.",
  },
  "/profile": {
    title: "Account Profile",
    description: "Manage your provider identity and business contact details.",
  },
  "/profile/support": {
    title: "Support & Help",
    description: "Create and track requests sent to platform support.",
  },
  "/promotions": {
    title: "Marketing Overview",
    description: "Manage internal offers and discover platform growth opportunities.",
  },
  "/promotions/new": {
    title: "Add New Promotion",
    description: "Configure a new offer, schedule, audience, and discount.",
  },
  "/restaurant-bookings": {
    title: "Restaurant Bookings",
    description: "Manage reservations, guest requests, payments, and booking status.",
  },
  "/reviews": {
    title: "Review Management",
    description: "Track and respond to customer feedback across services.",
  },
  "/services": {
    title: "Restaurant Services",
    description: "Manage restaurant menus, media, and service information.",
  },
  "/settings": {
    title: "Settings",
    description: "Configure your provider account and enabled services.",
  },
  "/settings/legal-content": {
    title: "Legal Content",
    description: "Manage the legal documents shown to your customers.",
  },
  "/spa-bookings": {
    title: "Spa Booking Management",
    description: "Manage appointments, guest requests, payments, and booking status.",
  },
  "/spa-services": {
    title: "Spa Services",
    description: "Manage treatments, media, availability, and service information.",
  },
};

export function dashboardHeaderForPath(pathname: string): DashboardHeader {
  const normalized =
    pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (EXACT_HEADERS[normalized]) return EXACT_HEADERS[normalized];
  if (/^\/customers\/[^/]+$/.test(normalized)) {
    return { title: "Customer Details", description: "Customer profile, contact information, and booking history." };
  }
  if (/^\/events\/[^/]+$/.test(normalized)) {
    return { title: "Event Details", description: "Event schedule, venue, availability, and booking performance." };
  }
  if (/^\/promotions\/[^/]+$/.test(normalized)) {
    return { title: "Promotion Details", description: "Review offer configuration, usage, and current status." };
  }
  if (/^\/hotel-services\/rooms\/[^/]+$/.test(normalized)) {
    return { title: "Edit Room", description: "Update room inventory, pricing, amenities, and images." };
  }
  if (/^\/hotel-services\/services\/[^/]+$/.test(normalized)) {
    return { title: "Edit Service", description: "Update guest-facing service details, availability, pricing, and imagery." };
  }
  if (/^\/profile\/support\/[^/]+$/.test(normalized)) {
    return { title: "Support Ticket", description: "View the conversation and reply to platform support." };
  }
  if (/^\/profile\/legal\/[^/]+$/.test(normalized)) {
    return { title: "Legal Document", description: "Review and update this customer-facing document." };
  }
  return { title: "Provider Dashboard" };
}

export function dashboardTitleForPath(pathname: string) {
  return dashboardHeaderForPath(pathname).title;
}
