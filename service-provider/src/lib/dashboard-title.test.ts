import { describe, expect, it } from "vitest";
import {
  dashboardHeaderForPath,
  dashboardTitleForPath,
} from "./dashboard-title";

describe("dashboardTitleForPath", () => {
  it("maps top-level management pages", () => {
    expect(dashboardTitleForPath("/dashboard")).toBe("Business Overview");
    expect(dashboardTitleForPath("/analytics")).toBe("Business Analytics");
    expect(dashboardTitleForPath("/spa-bookings")).toBe(
      "Spa Booking Management",
    );
    expect(dashboardTitleForPath("/event-bookings")).toBe("Event Bookings");
  });

  it("maps dynamic detail pages", () => {
    expect(dashboardTitleForPath("/customers/customer-id")).toBe(
      "Customer Details",
    );
    expect(dashboardTitleForPath("/events/event-id")).toBe("Event Details");
    expect(dashboardTitleForPath("/profile/support/ticket-id")).toBe(
      "Support Ticket",
    );
  });

  it("provides one centralized title and description per route", () => {
    expect(dashboardHeaderForPath("/analytics")).toEqual({
      title: "Business Analytics",
      description: "Live metrics from the vendor analytics endpoints.",
    });
    expect(dashboardHeaderForPath("/hotel-services/rooms/room-id").title).toBe(
      "Edit Room",
    );
  });
});
