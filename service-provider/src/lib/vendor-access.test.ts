import { describe, expect, it } from "vitest";
import {
  extractVendorCategories,
  getFallbackRouteForCategories,
  isRouteAllowedForCategories,
} from "./vendor-access";

describe("vendor route access", () => {
  it("normalizes and de-duplicates provider categories", () => {
    expect(extractVendorCategories(["hotel", "Hotel", "Restaurant"])).toEqual(["Hotel", "Restaurant"]);
    expect(extractVendorCategories(["Event Venue", "Spa"])).toEqual(["Spa"]);
  });

  it("keeps hotel vendors out of restaurant-only routes", () => {
    expect(isRouteAllowedForCategories("/restaurant-bookings", ["Hotel"])).toBe(false);
    expect(isRouteAllowedForCategories("/hotel-bookings", ["Hotel"])).toBe(true);
  });

  it("allows spa vendors to manage spa bookings and services only", () => {
    expect(isRouteAllowedForCategories("/spa-bookings", ["Spa"])).toBe(true);
    expect(isRouteAllowedForCategories("/spa-services", ["Spa"])).toBe(true);
    expect(isRouteAllowedForCategories("/restaurant-bookings", ["Spa"])).toBe(false);
  });

  it("gates Event and Happy Hour routes through their onboarding modules", () => {
    expect(isRouteAllowedForCategories("/events", ["Restaurant"])).toBe(false);
    expect(isRouteAllowedForCategories("/events/new", ["Event"])).toBe(true);
    expect(isRouteAllowedForCategories("/event-bookings", ["Event"])).toBe(true);
    expect(isRouteAllowedForCategories("/happy-hours", ["Restaurant"])).toBe(true);
    expect(isRouteAllowedForCategories("/happy-hours", ["Happy Hour"])).toBe(true);
  });

  it("selects a usable fallback for the vendor category", () => {
    expect(getFallbackRouteForCategories(["Hotel"])).toBe("/hotel-bookings");
    expect(getFallbackRouteForCategories(["Spa"])).toBe("/spa-bookings");
  });
});
